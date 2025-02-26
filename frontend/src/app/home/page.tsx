"use client";
import { useState } from "react";
import { useRouter } from "next/navigation" // next.js navigatioon
import Dropdown from "../components/Dropdown";
import MetricInput from "../components/MetricInput";
import styles from "./Home.module.css"

export default function Home() {
  const router = useRouter();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numReps, setNumReps] = useState("");
  const [maxVelocity, setMaxVelocity] = useState("");
  const [minVelocity, setMinVelocity] = useState("");

  const handleStart = () => {
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

    router.push("/dashboard")
  }

  return (
    <main>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        {/* Empty left div for spacing */}
        <div className={styles.leftDiv}></div>  

        {/* Centered text div */}
        <div className={styles.centerDiv}>
          <p className={styles.welcomeText}>Welcome to VBT</p>
        </div>

        {/* Right div with logo aligned right */}
        <div className={styles.rightDiv}>
          <img src="/VBT_logo_blue.png" alt="VBT Logo" className={styles.logo} />
        </div>
      </div>

      {/* Middle Area with Dropdown and Metric Inputs */}
      <div className={styles.middleDiv}>
      <div className={styles.dropdownContainer}>
          <div className="button-grid">
            <button className={styles.Squats} onClick={() => setSelectedOption("Squats")}>Squats</button>
            <button className={styles.Deadlift} onClick={() => setSelectedOption("Deadlift")}>Deadlift</button>
            <button className={styles.BenchPress} onClick={() => setSelectedOption("Bench Press")}>Bench Press</button>
            <button className={styles.HangCleans} onClick={() => setSelectedOption("Hang Cleans")}>Hang Cleans</button>
            <button className={styles.Jerks} onClick={() => setSelectedOption("Jerks")}>Jerks</button>
          </div>
          {selectedOption && <p className={styles.SelectedExercise}>You selected: {selectedOption}</p>}
        </div>
        {/* Metrics Section */}
        <div className={styles.metricsContainer}>
          <div className={styles.row}>
            <MetricInput label="Number of Reps:" value={numReps} onChange={setNumReps} />
            <MetricInput label="Max. velocity:" value={maxVelocity} onChange={setMaxVelocity} />
            <MetricInput label="Min. velocity:" value={minVelocity} onChange={setMinVelocity} />
          </div>
        </div>
      </div>

      {/* Bottom Div */}
      <div className={styles.bottomDiv}>
        <button className={styles.startButton} onClick={handleStart}>START</button> {/* ✅ Calls handleStart */}
        <button className={styles.resetButton} onClick={() => {
          setSelectedOption(null);
          setNumReps("");
          setMaxVelocity("");
          setMinVelocity("");
        }}>RESET</button>
      </div>
    </main>
  );
}