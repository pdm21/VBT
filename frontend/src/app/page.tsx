"use client";
import { useState } from "react";
import Dropdown from "./components/Dropdown";
import MetricInput from "./components/MetricInput";
import styles from "./styles/page.module.css"

export default function Home() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numReps, setNumReps] = useState("");
  const [maxVelocity, setMaxVelocity] = useState("");
  const [minVelocity, setMinVelocity] = useState("");

  return (
    <main>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        {/* Empty left div for spacing */}
        <div className={styles.leftDiv}></div>  

        {/* Centered text div */}
        <div className={styles.centerDiv}>
          <p className={styles.welcomeText}>Welcome</p>
        </div>

        {/* Right div with logo aligned right */}
        <div className={styles.rightDiv}>
          <img src="/logo.png" alt="VBT Logo" className={styles.logo} />
        </div>
      </div>

      {/* Middle Area with Dropdown and Metric Inputs */}
      <div className={styles.middleDiv}>
        <div className={styles.dropdownContainer}>
        {/* Dropdown for Exercise Selection */}
        <Dropdown
          options={["Bench Press", "Barbell Squat", "Overhead Press", "Hang Cleans"]}
          onSelect={(option) => setSelectedOption(option)}
        />
        {selectedOption && <p>You selected: {selectedOption}</p>}
        </div>
        {/* Metrics Section */}
        <div className={styles.metricsContainer}>
          <MetricInput label="Number of reps:" value={numReps} onChange={setNumReps} />
          <div className={styles.row}>
            <MetricInput label="Max. v:" value={maxVelocity} onChange={setMaxVelocity} />
            <MetricInput label="Min. v:" value={minVelocity} onChange={setMinVelocity} />
          </div>
        </div>
      </div>

      {/* Bottom Div */}
      <div className={styles.bottomDiv}>
        <button className={styles.startButton}>Start</button>
        <button className={styles.resetButton}>Reset</button>
      </div>
    </main>
  );
}