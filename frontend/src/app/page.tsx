"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import Dropdown from "./components/Dropdown";
import MetricInput from "./components/MetricInput";
import styles from "./home/Home.module.css"
import { useSocket } from "./contexts/SocketContext";

export default function Home() {
  const router = useRouter();
  const { socket } = useSocket();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numReps, setNumReps] = useState("");
  const [maxVelocity, setMaxVelocity] = useState("");
  const [minVelocity, setMinVelocity] = useState("");

  // Prefetch dashboard page
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleStart = async () => {
    // 1. check that no fields are empty
    if (!selectedOption || !numReps || !maxVelocity || !minVelocity) {
      alert("Please fill in all fields before starting!")
      return;
    }

    // 2. check that no values are negative
    const reps = Number(numReps);
    const maxV = Number(maxVelocity);
    const minV = Number(minVelocity);

    if (reps < 0 || maxV < 0 || minV < 0) {
      alert("Values may not be negative. Please provide valid values for reps, maxV and minV");
      return;
    }

    setIsLoading(true);
    const path = `/dashboard?reps=${reps}&maxV=${maxV}&minV=${minV}`;
    
    // Emit navigation event to all other clients
    socket?.emit('navigate', path);
    
    // Navigate locally
    router.push(path);
  }

  // Helper function to get button class name with selected state
  const getButtonClassName = (buttonName: string) => {
    return `${styles[buttonName]} ${selectedOption === buttonName ? styles.selected : ''}`;
  }

  return (
    <main className="apple-container">
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        {/* Empty left div for spacing */}
        <div className={styles.leftDiv}></div>  

        {/* Centered text div */}
        <div className={styles.centerDiv}>
          <p className={styles.welcomeText}>Velocity Based Training</p>
        </div>

        {/* Right div with logo aligned right */}
        <div className={styles.rightDiv}>
          <img src="/VBT_logo_blue.png" alt="VBT Logo" className={styles.logo} />
        </div>
      </div>

      {/* Middle Area with Exercise selection and Metric Inputs */}
      <div className={styles.middleDiv}>
        <div className={styles.dropdownContainer}>
          <div className={styles["button-grid"]}>
            <button 
              className={getButtonClassName("Squats")} 
              onClick={() => setSelectedOption("Squats")}
            >
              <span className={styles.buttonIcon}>🏋️</span>
              Squats
            </button>
            <button 
              className={getButtonClassName("Deadlift")} 
              onClick={() => setSelectedOption("Deadlift")}
            >
              <span className={styles.buttonIcon}>🔄</span>
              Deadlift
            </button>
            <button 
              className={getButtonClassName("BenchPress")} 
              onClick={() => setSelectedOption("Bench Press")}
            >
              <span className={styles.buttonIcon}>💪</span>
              Bench Press
            </button>
            <button 
              className={getButtonClassName("HangCleans")} 
              onClick={() => setSelectedOption("Hang Cleans")}
            >
              <span className={styles.buttonIcon}>⚡</span>
              Hang Cleans
            </button>
            <button 
              className={getButtonClassName("Jerks")} 
              onClick={() => setSelectedOption("OH Press")}
            >
              <span className={styles.buttonIcon}>🔝</span>
              OH Press
            </button>
          </div>
          {selectedOption && <p className={styles.SelectedExercise}>Selected: {selectedOption}</p>}
        </div>
        {/* Metrics Section */}
        <div className={styles.metricsContainer}>
          <div className={styles.row}>
            <MetricInput label="Number of Reps" value={numReps} onChange={setNumReps} />
            <MetricInput label="Max Velocity" value={maxVelocity} onChange={setMaxVelocity} />
            <MetricInput label="Min Velocity" value={minVelocity} onChange={setMinVelocity} />
          </div>
        </div>
      </div>

      {/* Bottom Div */}
      <div className={styles.bottomDiv}>
        <button 
          className={`${styles.startButton} ${isLoading ? styles.loading : ''}`} 
          onClick={handleStart}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Start'}
        </button>
        <button className={styles.resetButton} onClick={() => {
          setSelectedOption(null);
          setNumReps("");
          setMaxVelocity("");
          setMinVelocity("");
        }}>Reset</button>
      </div>
    </main>
  );
} 