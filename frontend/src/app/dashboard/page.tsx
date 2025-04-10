"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import styles from "./Dashboard.module.css";
import fs from 'fs';
import path from 'path';
import { useSocket } from "../contexts/SocketContext";
import Plot from 'react-plotly.js';

interface VelocityHistory {
  value: number;
  timestamp: number;
}

interface RepData {
  id: number;
  rep: number;
  velocity: number;
  isWithinTarget: boolean;
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
  const exercise = searchParams.get('exercise') || 'Exercise';
  const numReps = Number(searchParams.get('reps')) || 5;
  const maxVelocity = Number(searchParams.get('maxV')) || 1.0;
  const minVelocity = Number(searchParams.get('minV')) || 0.0;
  
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

  // Process CSV data into rep data
  useEffect(() => {
    if (!isLoading) {
      const newRepData = csvData.map((velocity, index) => ({
        id: index + 1,
        rep: index + 1,
        velocity,
        isWithinTarget: velocity >= minVelocity && velocity <= maxVelocity
      }));
      
      setRepData(newRepData);
    }
  }, [csvData, minVelocity, maxVelocity, isLoading]);
  
  const handleBackClick = () => {
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

  // Prepare graph data
  const labels = Array.from({ length: numReps }, (_, i) => `Rep ${i + 1}`);
  const barColors = csvData.map(val => 
    val >= minVelocity && val <= maxVelocity 
      ? 'rgb(70, 202, 129)' // Green for values within range
      : 'rgb(243, 164, 167)' // Red for values outside range
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.leftDiv}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <svg className={styles.backIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>
        
        <div className={styles.centerDiv}>
          {/* Center empty for balance */}
        </div>
        
        <div className={styles.rightDiv}>
          <div className={styles.statusIndicator}>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Connected to VBT
          </div>
        </div>
      </header>
      
      <div className={styles.content}>
        {/* Exercise Header */}
        <div className={styles.exerciseHeader}>
          <h1 className={styles.exerciseTitle}>{exercise}</h1>
          <p className={styles.exerciseParams}>
            Target velocity: {minVelocity} - {maxVelocity} m/s • Reps: {repData.length}/{numReps}
          </p>
        </div>
        
        {/* Graph Container */}
        <div className={styles.graphContainer}>
          <div className={styles.graphWrapper}>
            <Plot
              data={[
                {
                  x: labels,
                  y: csvData,
                  type: 'bar',
                  marker: {
                    color: barColors
                  },
                  hovertemplate: '%{y:.2f} m/s<extra></extra>'
                }
              ]}
              layout={{
                title: '',
                showlegend: false,
                autosize: true,
                margin: { l: 50, r: 20, t: 20, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                xaxis: {
                  gridcolor: '#e5e7eb',
                  zerolinecolor: '#e5e7eb'
                },
                yaxis: {
                  title: 'Velocity (m/s)',
                  gridcolor: '#e5e7eb',
                  zerolinecolor: '#e5e7eb'
                },
                annotations: [
                  {
                    x: 0,
                    y: minVelocity,
                    xref: 'x',
                    yref: 'y',
                    text: 'Min',
                    showarrow: false,
                    font: {
                      size: 12,
                      color: 'rgba(74, 123, 252, 1)'
                    },
                    bgcolor: 'white',
                    borderpad: 2,
                    xanchor: 'left',
                    xshift: -120
                  },
                  {
                    x: 0,
                    y: maxVelocity,
                    xref: 'x',
                    yref: 'y',
                    text: 'Max',
                    showarrow: false,
                    font: {
                      size: 12,
                      color: 'rgba(74, 123, 252, 1)'
                    },
                    bgcolor: 'white',
                    borderpad: 2,
                    xanchor: 'left',
                    xshift: -120
                  }
                ],
                shapes: [
                  {
                    type: 'line',
                    x0: -0.5,
                    x1: numReps - 0.5,
                    y0: minVelocity,
                    y1: minVelocity,
                    line: {
                      color: 'rgba(74, 123, 252, 0.8)',
                      width: 2,
                      dash: 'dot'
                    }
                  },
                  {
                    type: 'line',
                    x0: -0.5,
                    x1: numReps - 0.5,
                    y0: maxVelocity,
                    y1: maxVelocity,
                    line: {
                      color: 'rgba(74, 123, 252, 0.8)',
                      width: 2,
                      dash: 'dot'
                    }
                  }
                ]
              }}
              config={{
                displayModeBar: false,
                responsive: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Rep Cards */}
          <div className={styles.repCardsContainer}>
            {repData.map((rep) => (
              <div key={rep.id} className={styles.repCard}>
                <h3 className={styles.repCardTitle}>Rep {rep.rep}</h3>
                <div className={styles.repVelocity}>
                  {rep.velocity.toFixed(2)} <span className={styles.velocityUnit}>m/s</span>
                </div>
                <div className={`${styles.targetStatus} ${rep.isWithinTarget ? styles.withinTarget : styles.outsideTarget}`}>
                  {rep.isWithinTarget ? 'Within target range' : 'Outside target range'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

