"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import styles from "./home/Home.module.css"
import { useSocket } from "./contexts/SocketContext";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { socket } = useSocket();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState("");
  const [numReps, setNumReps] = useState("5");
  const [maxVelocity, setMaxVelocity] = useState("0.9");
  const [minVelocity, setMinVelocity] = useState("0.7");
  const [exerciseError, setExerciseError] = useState(false);

  // Prefetch dashboard page
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleStart = async () => {
    // Check that an exercise is selected
    if (!selectedExercise) {
      setExerciseError(true);
      return;
    }
    setExerciseError(false);

    // check that no values are negative
    const reps = Number(numReps);
    const maxV = Number(maxVelocity);
    const minV = Number(minVelocity);

    if (reps < 0 || maxV < 0 || minV < 0) {
      alert("Values may not be negative. Please provide valid values for reps, maxV and minV");
      return;
    }

    setIsLoading(true);
    const path = `/dashboard?exercise=${selectedExercise}&reps=${reps}&maxV=${maxV}&minV=${minV}`;
    
    // Emit navigation event to all other clients
    socket?.emit('navigate', path);
    
    // Navigate locally
    router.push(path);
  }

  return (
    <main className={styles.main}>
      {/* Header with logo and status */}
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11h18M4 18h16M7 4h10M9 18l-2-7M15 18l2-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>VBT System</span>
        </div>
        <div className={styles.headerRight}>
          <div className="status-indicator connected">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Sensor Connected
          </div>
        </div>
      </header>

      <div className={styles.contentWrapper}>
        {/* Hero section */}
        <div className={styles.heroSection}>
          <div className={styles.logoLarge}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11h18M4 18h16M7 4h10M9 18l-2-7M15 18l2-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.heroTitle}>VBT System</h1>
          <p className={styles.heroSubtitle}>Real-time velocity tracking for barbell-based strength training</p>
        </div>

        {/* Status card */}
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" className={styles.statusIcon}>
              <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <h2 className={styles.statusTitle}>Sensor Connected</h2>
            <div className={styles.statusIndicator}>Connected</div>
          </div>
          <p className={styles.statusMessage}>Your VBT sensor is connected and ready to use</p>
          <div className={styles.readyMessage}>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Ready to start velocity-based training session
          </div>
        </div>

        {/* Training setup card */}
        <div className={styles.setupCard}>
          <div className={styles.setupHeader}>
            <h2 className={styles.setupTitle}>Training Setup</h2>
            <p className={styles.setupSubtitle}>Configure your velocity-based training session</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Exercise</label>
            <div className={styles.selectWrapper}>
              <select 
                className={`${styles.selectInput} ${exerciseError ? styles.errorInput : ''}`}
                value={selectedExercise}
                onChange={(e) => {
                  setSelectedExercise(e.target.value);
                  setExerciseError(false);
                }}
              >
                <option value="" disabled>Select an exercise</option>
                <option value="Squats">Squats</option>
                <option value="Deadlift">Deadlift</option>
                <option value="Bench Press">Bench Press</option>
                <option value="Hang Cleans">Hang Cleans</option>
                <option value="OH Press">OH Press</option>
              </select>
              <div className={styles.selectArrow}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {exerciseError && (
              <div className={styles.errorMessage}>Exercise is required</div>
            )}
          </div>

          <div className={styles.velocityInputs}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Min Velocity (m/s)</label>
              <input
                type="number"
                className={styles.numberInput}
                value={minVelocity}
                onChange={(e) => setMinVelocity(e.target.value)}
                step="0.1"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Max Velocity (m/s)</label>
              <input
                type="number"
                className={styles.numberInput}
                value={maxVelocity}
                onChange={(e) => setMaxVelocity(e.target.value)}
                step="0.1"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Number of Reps</label>
            <input
              type="number"
              className={styles.numberInput}
              value={numReps}
              onChange={(e) => setNumReps(e.target.value)}
              min="1"
            />
          </div>

          <button 
            className={`${styles.startButton} ${isLoading ? styles.loading : ''}`} 
            onClick={handleStart}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Start Session'}
            {!isLoading && (
              <svg className={styles.startIcon} width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </main>
  );
} 