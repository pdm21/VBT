"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VelocityBar from "../components/VelocityBar"; // ✅ Import TSX component
import styles from "./Dashboard.module.css";

interface RepData {
  id: number;
  rep: number;
  velocity: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [repData, setRepData] = useState<RepData[]>([]);

  // Simulated live data update (Replace with real sensor data)
  useEffect(() => {
    const interval = setInterval(() => {
      setRepData((prev) =>
        prev.length < 5
          ? [...prev, { id: Date.now(), rep: prev.length + 1, velocity: Math.random() * 0.2 }] // Add a unique ID
          : prev.map((rep, index) =>
              index === 0
                ? { ...rep, id: Date.now(), velocity: Math.random() * 0.2 } // Ensure updated rep has a new ID
                : prev[index - 1]
            )
      );
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);
  
  return (
    <main className={styles.main}>
      <div className={styles.homeButtonDiv}>
        <button className={styles.homeButton} onClick={() => router.push("/home")}>HOME</button>
      </div>

      <div className={styles.liveDashboard}>
        <h1>Live Dashboard</h1>
      </div>
      
      <div className={styles.graphContainer}>
        {repData.map((rep) => (
        <VelocityBar key={rep.id} velocity={rep.velocity} />
      ))}
      </div>
    </main>
  );
}

