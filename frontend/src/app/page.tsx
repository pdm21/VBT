"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./home/Home.module.css";
import { useSocket } from "./contexts/SocketContext";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { socket, isConnected, deviceType } = useSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const listOfConnectedDevices: number[] = []; // this will be a fastapi call to get_connected that returns an array of the connected devices - ex: [3, 4]
  const [connectedDevices, setConnectedDevices] = useState<number[]>(
    listOfConnectedDevices
  );

  const [selectedExercise, setSelectedExercise] = useState("");
  const [numReps, setNumReps] = useState("5");
  const [maxVelocity, setMaxVelocity] = useState("0.9");
  const [minVelocity, setMinVelocity] = useState("0.7");
  const [exerciseError, setExerciseError] = useState(false);

  // Prefetch dashboard page
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const fetchConnectedDevices = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("http://192.168.0.100:8000/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.status === "success") {
        setConnectedDevices(data.connected_devices);
        console.log("Connected devices:", data.connected_devices);
      } else {
        console.error("Failed to get connected devices:", data.message);
      }
    } catch (error) {
      console.error("Error fetching connected devices:", error);
    } finally {
      setIsConnecting(false);
    }
  };

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
      alert(
        "Values may not be negative. Please provide valid values for reps, maxV and minV"
      );
      return;
    }

    // =================================================

    try {
      // Clear CSV files first
      const clearResponse = await fetch(
        "http://192.168.0.100:8000/clear_csvs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const clearData = await clearResponse.json();
      if (clearData.status !== "success") {
        console.warn("Warning: Failed to clear CSV files:", clearData.message);
        // Continue anyway as this is not critical
      }

      // Call the connect endpoint
      const response = await fetch("http://192.168.0.100:8000/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.status !== "success") {
        alert("Failed to connect devices: " + data.message);
        console.log("Failure. Not Connected");
        return;
      } else {
        console.log("Success. Connected");
        console.log(data);
      }

      // =================================================

      setIsLoading(true);
      const path = `/dashboard?exercise=${selectedExercise}&reps=${reps}&maxV=${maxV}&minV=${minV}&devices=${data.connected_devices.join(
        ","
      )}`;

      // Emit session state to sync all clients
      socket?.emit("sessionState", {
        page: "dashboard",
        params: {
          exercise: selectedExercise,
          reps,
          maxV,
          minV,
        },
      });

      // Navigate locally
      router.push(path);
    } catch (error) {
      alert("Error connecting to devices. Please try again.");
      console.error("Connection error:", error);
    }
  };

  return (
    <main className={styles.main}>
      {/* Connection Status */}
      <div
        className={`${styles.connectionStatus} ${
          isConnected ? styles.connected : styles.disconnected
        }`}
      >
        {isConnected ? (
          <>
            <span className={styles.statusDot}></span>
            Connected ({deviceType === "host" ? "Host" : "Client"})
          </>
        ) : (
          <>
            <span className={styles.statusDot}></span>
            Disconnected - Check Connection
          </>
        )}
      </div>

      {/* Header with logo and status */}
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <span>VBT System</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.departmentText}>
            Hamilton College Athletics Department
          </span>
        </div>
      </header>
      <div className={styles.contentWrapper}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.logoLarge}>
            <img
              src="/VBT_logo_gray.png"
              alt="VBT Logo"
              width={200}
              height={100}
              style={{ objectFit: "contain" }}
            />
          </div>
          <h1 className={styles.heroTitle}>VBT System</h1>
          <p className={styles.heroSubtitle}>
            Real-time velocity tracking for barbell-based strength training
          </p>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left column - Sensors */}
          <div className={styles.sensorsColumn}>
            <div className={styles.connectCard}>
              <button
                className={`${styles.connectButton} ${isConnecting ? styles.loading : ""}`}
                onClick={fetchConnectedDevices}
                disabled={isConnecting}
              >
                {isConnecting ? "Loading..." : "Connect VBT Devices"}
              </button>
            </div>
            {[1, 2, 3, 4, 5].map((sensorId) => (
              <div key={sensorId} className={styles.sensorCard}>
                <div className={styles.sensorHeader}>
                  <svg
                    className={styles.sensorIcon}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className={styles.sensorTitle}>Sensor {sensorId}</h3>
                  <div
                    className={styles.sensorStatus}
                    style={{
                      backgroundColor: connectedDevices.includes(sensorId)
                        ? "var(--success-light)"
                        : "var(--danger-light)",
                      color: connectedDevices.includes(sensorId)
                        ? "var(--success)"
                        : "var(--danger)",
                    }}
                  >
                    {connectedDevices.includes(sensorId) ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {connectedDevices.includes(sensorId)
                      ? "Connected"
                      : "Disconnected"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right column - Setup */}
          <div className={styles.setupColumn}>
            {/* Training setup card */}
            <div className={styles.setupCard}>
              <div className={styles.setupHeader}>
                <h2 className={styles.setupTitle}>Training Setup</h2>
                <p className={styles.setupSubtitle}>
                  Configure your velocity-based training session
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Exercise</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={`${styles.selectInput} ${
                      exerciseError ? styles.errorInput : ""
                    }`}
                    value={selectedExercise}
                    onChange={(e) => {
                      setSelectedExercise(e.target.value);
                      setExerciseError(false);
                    }}
                  >
                    <option value="" disabled>
                      Select an exercise
                    </option>
                    <option value="Squats">Squats</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Bench Press">Bench Press</option>
                    <option value="Hang Cleans">Hang Cleans</option>
                    <option value="OH Press">OH Press</option>
                  </select>
                  <div className={styles.selectArrow}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {exerciseError && (
                  <div className={styles.errorMessage}>
                    Exercise is required
                  </div>
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
                className={`${styles.startButton} ${
                  isLoading ? styles.loading : ""
                }`}
                onClick={handleStart}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Start Session"}
                {!isLoading && (
                  <svg
                    className={styles.startIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
