"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VelocityBar from "../components/VelocityBar"; // ✅ Import TSX component
import styles from "./Dashboard.module.css";
import { loadTestData, processTestData } from "../utils/dataProcessor";

interface RepData {
  id: number;
  rep: number;
  velocity: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [repData, setRepData] = useState<RepData[]>([]);
  const [testDataIndex, setTestDataIndex] = useState(0);
  const [velocities, setVelocities] = useState<number[]>([]);
  const [currentVelocity, setCurrentVelocity] = useState<number>(0);

  // Load test data on component mount
  useEffect(() => {
    async function fetchData() {
      const rawData = await loadTestData();
      const processedVelocities = processTestData(rawData);
      console.log("Processed velocities range:", {
        min: Math.min(...processedVelocities),
        max: Math.max(...processedVelocities),
        avg: processedVelocities.reduce((a, b) => a + b, 0) / processedVelocities.length
      });
      setVelocities(processedVelocities);
    }
    fetchData();
  }, []);

  // Simulate live data updates using test data
  useEffect(() => {
    if (velocities.length === 0) return;

    const interval = setInterval(() => {
      const velocity = velocities[testDataIndex % velocities.length];
      setCurrentVelocity(velocity);

      setRepData((prev) => {
        if (prev.length < 5) {
          return [...prev, { 
            id: Date.now(), 
            rep: prev.length + 1, 
            velocity: velocity
          }];
        } else {
          return prev.map((rep, index) => 
            index === 0 
              ? { ...rep, id: Date.now(), velocity: velocity } 
              : prev[index - 1]
          );
        }
      });

      setTestDataIndex(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [velocities, testDataIndex]);
  
  return (
    <main className={styles.main}>
      <div className={styles.homeButtonDiv}>
        <button className={styles.homeButton} onClick={() => router.push("/home")}>HOME</button>
      </div>

      <div className={styles.liveDashboard}>
        <h1>Live Dashboard</h1>
        <div style={{ marginBottom: '20px' }}>
          <p>Current Velocity: {currentVelocity?.toFixed(4)} m/s</p>
          <p>Data Point: {testDataIndex}</p>
        </div>
      </div>
      
      <div className={styles.graphContainer}>
        {repData.map((rep) => (
        <VelocityBar key={rep.id} velocity={rep.velocity} />
      ))}
      </div>
    </main>
  );
}

