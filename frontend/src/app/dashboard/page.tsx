"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import styles from "./Dashboard.module.css";
import Image from "next/image";
import { useSocket } from "../contexts/SocketContext";

// Lazy load the VelocityBar component
const VelocityBar = dynamic(() => import("../components/VelocityBar"), {
  loading: () => <div className={styles.loadingBar}>Loading...</div>,
  ssr: false // Disable server-side rendering for this component
});

interface VelocityHistory {
  value: number;
  timestamp: number;
}

interface RepData {
  id: number;
  rep: number;
  velocities: number[];
  velocityHistory: VelocityHistory[];
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();
  const [repData, setRepData] = useState<RepData[]>([]);
  const [csvData, setCsvData] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastCsvContent = useRef<string>("");
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  // Get parameters from URL
  const numReps = Number(searchParams.get('reps')) || 5;
  const maxVelocity = Number(searchParams.get('maxV')) || 1.0;
  const minVelocity = Number(searchParams.get('minV')) || 0.0;
  
  // Always show 5 devices
  const numDevices = 5;

  // Initialize rep data immediately
  useEffect(() => {
    setRepData(Array.from({ length: numDevices }, (_, index) => ({
      id: Date.now() + index,
      rep: index + 1,
      velocities: Array(numReps).fill(0),
      velocityHistory: Array(numReps).fill(0).map((_, i) => ({
        value: 0,
        timestamp: Date.now() - (numReps - 1 - i) * 1000
      }))
    })));
  }, [numDevices, numReps]);

  // Initialize CSV file with zeros in the background
  useEffect(() => {
    const initializeCsv = async () => {
      if (initialized.current) return;
      
      try {
        const zeros = Array(numReps).fill("0.00").join('\n');
        const response = await fetch('/api/initialize-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            content: zeros,
            numReps: numReps 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize CSV file');
        }

        initialized.current = true;
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing CSV:', error);
        setIsInitialized(true);
      }
    };

    initializeCsv();
  }, [numReps]);

  // Load CSV data and set up polling
  useEffect(() => {
    const loadCsvData = async () => {
      try {
        const response = await fetch('/velocity_data.csv', {
          method: 'GET',
          headers: {
            'Content-Type': 'text/csv',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load CSV data: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        if (text !== lastCsvContent.current) {
          lastCsvContent.current = text;
          
          const rows = text.split('\n').filter(row => row.trim() !== '');
          const velocities = rows.map(row => parseFloat(row.trim()));
          const validVelocities = velocities.filter(v => !isNaN(v));
          
          if (validVelocities.length === 0) {
            setCsvData(Array(numReps).fill(0));
          } else {
            const selectedVelocities = validVelocities.slice(0, numReps);
            while (selectedVelocities.length < numReps) {
              selectedVelocities.push(0);
            }
            setCsvData(selectedVelocities);
          }
        }
      } catch (error) {
        console.error('Error loading CSV data:', error);
        setCsvData(Array(numReps).fill(0));
      }
    };

    // Start polling immediately
    loadCsvData();
    pollingInterval.current = setInterval(loadCsvData, 500);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [numReps]);

  // Update rep data with CSV data
  useEffect(() => {
    if (csvData.length > 0) {
      setRepData(prev => prev.map((rep, index) => {
        if (index === 0) {
          return {
            ...rep,
            velocities: csvData,
            velocityHistory: csvData.map((value, i) => ({
              value,
              timestamp: Date.now() - (csvData.length - 1 - i) * 1000
            }))
          };
        }
        return rep;
      }));
    }
  }, [csvData]);
  
  const handleHomeClick = () => {
    const path = "/";
    socket?.emit('navigate', path);
    router.push(path);
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.leftDiv}>
          <button className={styles.homeButton} onClick={handleHomeClick}>HOME</button>
        </div>
        <div className={styles.centerDiv}>
          <p>Live Dashboard</p>
        </div>
        <div className={styles.rightDiv}>
          <Image 
            src="/VBT_logo_blue.png" 
            alt="VBT Logo" 
            width={200} 
            height={80} 
            className={styles.logo}
            priority
          />
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.graphContainer}>
          {repData.map((rep) => (
            <div key={rep.id} className={styles.graphWrapper}>
              <h2 className={styles.graphTitle}>Device {rep.rep}</h2>
              <div className={styles.graphContent}>
                <Suspense fallback={<div className={styles.loadingBar}>Loading...</div>}>
                  <VelocityBar 
                    velocities={rep.velocities} 
                    maxVelocity={maxVelocity}
                    minVelocity={minVelocity}
                  />
                </Suspense>
              </div>
              <div className={styles.velocityHistory}>
                <h3>Velocity:</h3>
                <ul>
                  {rep.velocityHistory.map((v, index) => (
                    <li key={v.timestamp}>
                      {index + 1}. {v.value.toFixed(3)} m/s
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

