"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import styles from "./Dashboard.module.css";
import Image from "next/image";
import fs from 'fs';
import path from 'path';
import { useSocket } from "../contexts/SocketContext";

// Lazy load the VelocityBar component
const VelocityBar = dynamic(() => import("../components/VelocityBar"), {
  loading: () => <div className={styles.loadingBar}>Loading...</div>
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
  const [isLoading, setIsLoading] = useState(true);
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

  // Initialize CSV file with zeros
  useEffect(() => {
    const initializeCsv = async () => {
      if (initialized.current) return;
      
      try {
        // Create content with numReps zeros
        const zeros = Array(numReps).fill("0.00").join('\n');
        
        // Send request to update CSV file
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
        console.log(`CSV initialized with ${numReps} zeros`);
        
        // Set initial state
        setCsvData(Array(numReps).fill(0));
        setIsLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing CSV:', error);
        // Still set initial state even if file write fails
        setCsvData(Array(numReps).fill(0));
        setIsLoading(false);
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
        
        // Only update if the content has changed
        if (text !== lastCsvContent.current) {
          console.log('CSV data changed:', text);
          lastCsvContent.current = text;
          
          const rows = text.split('\n').filter(row => row.trim() !== '');
          const velocities = rows.map(row => parseFloat(row.trim()));
          
          // Filter out any NaN values
          const validVelocities = velocities.filter(v => !isNaN(v));
          
          if (validVelocities.length === 0) {
            // If no valid data yet, use zeros
            setCsvData(Array(numReps).fill(0));
          } else {
            // Take only the number of velocities specified by numReps
            const selectedVelocities = validVelocities.slice(0, numReps);
            // If we have fewer velocities than numReps, pad with zeros
            while (selectedVelocities.length < numReps) {
              selectedVelocities.push(0);
            }
            setCsvData(selectedVelocities);
          }
        }
      } catch (error) {
        console.error('Error loading CSV data:', error);
        // If there's an error, keep using zeros
        setCsvData(Array(numReps).fill(0));
      }
    };

    // Set up polling interval (check every 500ms)
    pollingInterval.current = setInterval(loadCsvData, 500);
    
    // Clean up interval on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [numReps]);

  // Initialize rep data with CSV data for the first graph
  useEffect(() => {
    if (!isLoading) {
      setRepData(prev => {
        if (prev.length < numDevices) {
          // Initialize 5 device graphs
          return Array.from({ length: numDevices }, (_, index) => {
            if (index === 0) {
              // First graph uses CSV data
              return {
                id: Date.now() + index,
                rep: index + 1,
                velocities: csvData,
                velocityHistory: csvData.map((value, i) => ({
                  value,
                  timestamp: Date.now() - (csvData.length - 1 - i) * 1000
                }))
              };
            } else {
              // Other graphs start empty
              return {
                id: Date.now() + index,
                rep: index + 1,
                velocities: [],
                velocityHistory: []
              };
            }
          });
        } else {
          // Update only the first graph with CSV data
          return prev.map((rep, index) => {
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
          });
        }
      });
    }
  }, [csvData, numDevices, isLoading]);
  
  const handleHomeClick = () => {
    const path = "/";
    socket?.emit('navigate', path);
    router.push(path);
  };

  if (!isInitialized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Initializing dashboard...</p>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.leftDiv}>
          <button className={styles.homeButton} onClick={handleHomeClick}>
            Home
          </button>
        </div>
        <div className={styles.centerDiv}>
          <p>Live Dashboard</p>
        </div>
        <div className={styles.rightDiv}>
          <Image 
            src="/VBT_logo_blue.png" 
            alt="VBT Logo" 
            width={120} 
            height={40} 
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
            </div>
          ))}
        </div>
        
        <div className={styles.dashboardInfo}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Training Parameters</div>
            <div className={styles.infoDetail}>
              <span>Reps: {numReps}</span>
              <span>Max Velocity: {maxVelocity} m/s</span>
              <span>Min Velocity: {minVelocity} m/s</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

