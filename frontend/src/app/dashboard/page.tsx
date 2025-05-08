"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Dashboard.module.css";
import { useSocket } from "../contexts/SocketContext";
import { toast, Toaster } from "react-hot-toast";

// Import Plot dynamically with ssr disabled
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Define RepData type
interface RepData {
  id: number;
  rep: number;
  velocity: number;
  isWithinTarget: boolean;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected, deviceType } = useSocket();
  const [deviceData, setDeviceData] = useState<{ [key: number]: number[] }>({});
  const [repData, setRepData] = useState<RepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "single">("all");
  const [selectedDevice, setSelectedDevice] = useState<number>(1);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const lastCsvContents = useRef<{ [key: number]: string }>({});
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  // Get parameters from URL
  const exercise = searchParams.get("exercise") || "Exercise";
  const numReps = Number(searchParams.get("reps")) || 5;
  const maxVelocity = Number(searchParams.get("maxV")) || 1.0;
  const minVelocity = Number(searchParams.get("minV")) || 0.0;

  // Mock data for multiple devices
  const devices = [1, 2, 3, 4, 5].map((id) => ({
    id,
    data: deviceData[id] || Array(numReps).fill(0),
    exercise,
    numReps,
    maxVelocity,
    minVelocity,
  }));

  // Add a mock list of connected devices for testing purposes
  const connectedDevices = [1, 2, 3, 4, 5]; // Change this array to simulate connected devices
  // Need to return an array of connected devices from the API call

  // Filter devices to only include connected ones
  const filteredDevices = devices.filter((device) =>
    connectedDevices.includes(device.id)
  );

  // Initialize CSV files with zeros
  useEffect(() => {
    const initializeCsv = async () => {
      if (initialized.current) return;

      try {
        // Create content with numReps zeros
        const zeros = Array(numReps).fill("0.00").join("\n");

        // Initialize each device's CSV file
        for (let deviceId = 1; deviceId <= 5; deviceId++) {
          const response = await fetch("/api/initialize-csv", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: zeros,
              numReps: numReps,
              deviceId: deviceId,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Failed to initialize CSV file for device ${deviceId}`
            );
          }
        }

        initialized.current = true;
        console.log("CSV files initialized with zeros");

        // Set initial state
        const initialData = Object.fromEntries(
          Array.from({ length: 5 }, (_, i) => [i + 1, Array(numReps).fill(0)])
        );
        setDeviceData(initialData);
        setIsLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing CSV files:", error);
        // Still set initial state even if file write fails
        const initialData = Object.fromEntries(
          Array.from({ length: 5 }, (_, i) => [i + 1, Array(numReps).fill(0)])
        );
        setDeviceData(initialData);
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
        const newDeviceData: { [key: number]: number[] } = {};

        // Load data for each device
        for (let deviceId = 1; deviceId <= 5; deviceId++) {
          const response = await fetch(`/velocity_data_Device${deviceId}.csv`, {
            method: "GET",
            headers: {
              "Content-Type": "text/csv",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to load CSV data for device ${deviceId}: ${response.status} ${response.statusText}`
            );
          }

          const text = await response.text();

          // Only update if the content has changed
          if (text !== lastCsvContents.current[deviceId]) {
            console.log(`CSV data changed for device ${deviceId}:`, text);
            lastCsvContents.current[deviceId] = text;

            const rows = text.split("\n").filter((row) => row.trim() !== "");
            const velocities = rows.map((row) => parseFloat(row.trim()));

            // Filter out any NaN values
            const validVelocities = velocities.filter((v) => !isNaN(v));

            if (validVelocities.length === 0) {
              // If no valid data yet, use zeros
              newDeviceData[deviceId] = Array(numReps).fill(0);
            } else {
              // Take only the number of velocities specified by numReps
              const selectedVelocities = validVelocities.slice(0, numReps);
              // If we have fewer velocities than numReps, pad with zeros
              while (selectedVelocities.length < numReps) {
                selectedVelocities.push(0);
              }
              newDeviceData[deviceId] = selectedVelocities;
            }
          } else {
            // Use existing data if no changes
            newDeviceData[deviceId] =
              deviceData[deviceId] || Array(numReps).fill(0);
          }
        }

        setDeviceData(newDeviceData);
      } catch (error) {
        console.error("Error loading CSV data:", error);
        // If there's an error, keep using zeros for all devices
        const errorData = Object.fromEntries(
          Array.from({ length: 5 }, (_, i) => [i + 1, Array(numReps).fill(0)])
        );
        setDeviceData(errorData);
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
  }, [numReps, deviceData]);

  // Add effect to handle real-time velocity updates
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "velocity_update",
      (data: { deviceId: number; velocities: number[] }) => {
        setDeviceData((prev) => ({
          ...prev,
          [data.deviceId]: data.velocities,
        }));
      }
    );

    socket.on("reset_request", () => {
      handleReset();
    });

    return () => {
      socket.off("velocity_update");
      socket.off("reset_request");
    };
  }, [socket]);

  // Process CSV data into rep data for selected device
  useEffect(() => {
    if (!isLoading) {
      const deviceVelocities =
        deviceData[selectedDevice] || Array(numReps).fill(0);
      const newRepData = deviceVelocities.map((velocity, index) => ({
        id: index + 1,
        rep: index + 1,
        velocity,
        isWithinTarget: velocity >= minVelocity && velocity <= maxVelocity,
      }));

      setRepData(newRepData);
    }
  }, [deviceData, selectedDevice, minVelocity, maxVelocity, isLoading]);

  const handleBackClick = async () => {
    toast.success("Session ended. Returning to home page.");
    const path = "/";
    socket?.emit("sessionState", {
      page: "home",
      params: {},
    });
    setTimeout(() => {
      router.push(path);
    }, 1000);
  };

  const handleReset = async () => {
    try {
      // Create content with numReps zeros
      const zeros = Array(numReps).fill("0.00").join("\n");

      // Show loading toast
      const loadingToast = toast.loading("Resetting data...");

      // Reset each device's CSV file
      for (let deviceId = 1; deviceId <= 5; deviceId++) {
        const response = await fetch("/api/initialize-csv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: zeros,
            numReps: numReps,
            deviceId: deviceId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to reset CSV file for device ${deviceId}`);
        }
      }

      // Reset the device data state
      const resetData = Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [i + 1, Array(numReps).fill(0)])
      );
      setDeviceData(resetData);

      // Notify other clients about the reset
      socket?.emit("reset_request");

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("All devices reset successfully");
    } catch (error) {
      console.error("Error resetting devices:", error);
      toast.error("Failed to reset devices");
    }
  };

  const handleStartWorkout = async () => {
    // Added async keyword
    if (!isConnected) {
      toast.error("Cannot start workout: Device not connected");
      return;
    }

    try {
      const response = await fetch("http://192.168.0.100:8000/do_reps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          num_reps: numReps,
        }),
      });

      const data = await response.json();

      if (data.status !== "success") {
        alert("Failed to start reps: " + data.message);
        console.log("Failure. Not Started");
        return;
      }

      console.log("Success. Started reps");
      console.log(data);

      setWorkoutStarted(true);
      toast.success("Starting workout session");
      socket?.emit("sessionState", {
        page: "dashboard",
        params: { workoutStarted: "true" },
      });
    } catch (error) {
      alert("Error connecting to devices. Please try again.");
      console.error("Connection error:", error);
    }
  };

  const handleStopWorkout = async () => {
    try {
      const response = await fetch("http://192.168.0.100:8000/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.status !== "success") {
        alert("Failed to stop reps: " + data.message);
        console.log("Failure. Not Stopped");
        return;
      }
      console.log("Success. Stopped reps");
      console.log(data);

      setWorkoutStarted(false);
      toast.success("Workout session stopped");
      socket?.emit("sessionState", {
        page: "dashboard",
        params: { workoutStarted: "false" },
      });
    } catch (error) {
      alert("Error connecting to devices. Please try again.");
      console.error("Connection error:", error);
    }
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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.leftDiv}>
          <div className={styles.headerLogo}>
            <img
              src="/VBT_Logo_White.png"
              alt="VBT Logo"
              width={100}
              height={50}
              style={{ objectFit: "contain" }}
            />
            {workoutStarted ? (
              <button
                className={styles.stopWorkoutButton}
                onClick={handleStopWorkout}
              >
                Stop Workout
              </button>
            ) : (
              <button
                className={styles.startWorkoutButton}
                onClick={handleStartWorkout}
                // disabled={!isConnected}
              >
                Start Workout
              </button>
            )}
          </div>
        </div>

        <div className={styles.centerDiv}>
          <h1 className={styles.pageTitle}>
            {exercise}{" "}
            <span className={styles.pageTitleHighlight}>
              - Velocity Tracking
            </span>
          </h1>
        </div>

        <div className={styles.rightDiv}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleButton} ${
                viewMode === "all" ? styles.active : ""
              }`}
              onClick={() => setViewMode("all")}
            >
              All Devices
            </button>
            <button
              className={`${styles.viewToggleButton} ${
                viewMode === "single" ? styles.active : ""
              }`}
              onClick={() => {
                setViewMode("single");
                setSelectedDevice(1);
              }}
            >
              Single View
            </button>
          </div>

          <button className={styles.resetButton} onClick={handleReset}>
            <svg
              className={styles.resetIcon}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Reset
          </button>

          <button className={styles.endSessionButton} onClick={handleBackClick}>
            End Session
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {viewMode === "all" ? (
          <div className={styles.devicesGrid}>
            {filteredDevices.map((device) => {
              const deviceVelocities =
                deviceData[device.id] || Array(numReps).fill(0);
              const completedReps = deviceVelocities.filter(
                (v) => v > 0
              ).length;
              const avgVelocity =
                deviceVelocities.reduce((a, b) => a + b, 0) /
                (completedReps || 1);

              return (
                <div
                  key={device.id}
                  className={styles.deviceCard}
                  onClick={() => {
                    setSelectedDevice(device.id);
                    setViewMode("single");
                  }}
                >
                  <div className={styles.deviceHeader}>
                    <h3 className={styles.deviceTitle}>
                      Device {device.id} - Athlete {device.id}
                    </h3>
                    <div className={styles.deviceSubtitle}>
                      {device.exercise} - Velocity Tracking
                    </div>
                  </div>

                  <div className={styles.deviceMetrics}>
                    <div className={styles.metricRow}>
                      <span className={styles.metricLabel}>Reps</span>
                      <span className={styles.metricValue}>
                        {completedReps}/{device.numReps}
                      </span>
                    </div>
                    <div className={styles.metricRow}>
                      <span className={styles.metricLabel}>Avg</span>
                      <span className={styles.metricValue}>
                        {avgVelocity.toFixed(2)} m/s
                      </span>
                    </div>
                  </div>

                  <div className={styles.miniGraph}>
                    <Plot
                      data={[
                        {
                          type: "bar",
                          x: labels,
                          y: deviceVelocities,
                          marker: {
                            color: deviceVelocities.map(
                              (val) =>
                                val < device.minVelocity
                                  ? "rgb(239, 68, 68)" // red for below target
                                  : val > device.maxVelocity
                                  ? "rgb(245, 158, 11)" // yellow for above target
                                  : "rgb(34, 197, 94)" // green for within target
                            ),
                          },
                          hoverinfo: "y",
                          showlegend: false,
                        },
                      ]}
                      layout={{
                        margin: { t: 10, r: 10, l: 40, b: 30 },
                        yaxis: {
                          range: [0, 1.5],
                          tickformat: ".2f",
                          fixedrange: true,
                        },
                        xaxis: {
                          fixedrange: true,
                        },
                        paper_bgcolor: "transparent",
                        plot_bgcolor: "transparent",
                        bargap: 0.3,
                        shapes: [
                          {
                            type: "line",
                            x0: -0.5,
                            x1: device.numReps - 0.5,
                            y0: device.minVelocity,
                            y1: device.minVelocity,
                            line: {
                              color: "rgba(74, 123, 252, 0.8)",
                              width: 2,
                            },
                          },
                          {
                            type: "line",
                            x0: -0.5,
                            x1: device.numReps - 0.5,
                            y0: device.maxVelocity,
                            y1: device.maxVelocity,
                            line: {
                              color: "rgba(74, 123, 252, 0.8)",
                              width: 2,
                            },
                          },
                        ],
                      }}
                      config={{
                        displayModeBar: false,
                        responsive: true,
                      }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Device Tabs */}
            <div className={styles.deviceTabs}>
              {devices.map((device) => (
                <button
                  key={device.id}
                  className={`${styles.deviceTab} ${
                    selectedDevice === device.id ? styles.active : ""
                  }`}
                  onClick={() => setSelectedDevice(device.id)}
                >
                  Device {device.id}
                </button>
              ))}
            </div>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
              {/* Exercise Card */}
              <div className={styles.metricCard}>
                <div className={styles.metricCardHeader}>
                  <svg
                    className={styles.metricCardIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 19h16M4 5h16M9 12h6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={styles.metricCardTitle}>Exercise</span>
                </div>
                <div className={styles.metricCardValue}>{exercise}</div>
                <div className={styles.metricCardSubtext}>
                  Target: {minVelocity.toFixed(2)} - {maxVelocity.toFixed(2)}{" "}
                  m/s
                </div>
              </div>

              {/* Completed Reps Card */}
              <div className={styles.metricCard}>
                <div className={styles.metricCardHeader}>
                  <svg
                    className={styles.metricCardIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={styles.metricCardTitle}>Completed Reps</span>
                </div>
                <div className={styles.metricCardValue}>
                  {repData.filter((r) => r.velocity > 0).length}
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${
                        (repData.filter(
                          (r) => r.isWithinTarget && r.velocity > 0
                        ).length /
                          repData.filter((r) => r.velocity > 0).length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className={styles.metricCardSubtext}>
                  {Math.round(
                    (repData.filter((r) => r.isWithinTarget && r.velocity > 0)
                      .length /
                      repData.filter((r) => r.velocity > 0).length) *
                      100
                  ) || 0}
                  % in target
                </div>
              </div>

              {/* Average Velocity Card */}
              <div className={styles.metricCard}>
                <div className={styles.metricCardHeader}>
                  <svg
                    className={styles.metricCardIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 7h8m-8 10h8M3 17l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={styles.metricCardTitle}>
                    Average Velocity
                  </span>
                </div>
                <div className={styles.metricCardValue}>
                  {(
                    repData.reduce((acc, rep) => acc + rep.velocity, 0) /
                      repData.filter((r) => r.velocity > 0).length || 0
                  ).toFixed(2)}
                </div>
                <div className={styles.metricCardSubtext}>meters/second</div>
              </div>

              {/* Velocity Range Card */}
              <div className={styles.metricCard}>
                <div className={styles.metricCardHeader}>
                  <svg
                    className={styles.metricCardIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 7h18M3 12h18M3 17h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={styles.metricCardTitle}>Velocity Range</span>
                </div>
                <div className={styles.velocityRangeValues}>
                  <span className={styles.velocityMin}>
                    {Math.min(
                      ...repData
                        .filter((r) => r.velocity > 0)
                        .map((r) => r.velocity)
                    ).toFixed(2)}
                  </span>
                  <span className={styles.velocityRangeSeparator}>to</span>
                  <span className={styles.velocityMax}>
                    {Math.max(
                      ...repData
                        .filter((r) => r.velocity > 0)
                        .map((r) => r.velocity)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className={styles.metricCardSubtext}>min/max m/s</div>
              </div>
            </div>

            {/* Graph Title */}
            <div className={styles.graphHeader}>
              <h2 className={styles.graphTitle}>
                Rep Velocity - Device {selectedDevice}
              </h2>
              <div className={styles.graphSubtitle}>
                Real-time velocity tracking for Athlete {selectedDevice}
              </div>
            </div>

            {/* Graph Container */}
            <div className={styles.graphContainer}>
              <div className={styles.graphWrapper}>
                <Plot
                  data={[
                    {
                      x: labels,
                      y: selectedDevice
                        ? deviceData[selectedDevice]
                        : Array(numReps).fill(0),
                      type: "bar",
                      marker: {
                        color: (selectedDevice
                          ? deviceData[selectedDevice]
                          : Array(numReps).fill(0)
                        ).map(
                          (val) =>
                            val < minVelocity
                              ? "rgb(239, 68, 68)" // red for below target
                              : val > maxVelocity
                              ? "rgb(245, 158, 11)" // yellow for above target
                              : "rgb(34, 197, 94)" // green for within target
                        ),
                      },
                      hovertemplate: "%{y:.2f} m/s<extra></extra>",
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 50, r: 20, t: 20, b: 40 },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    xaxis: {
                      title: "Repetition",
                      gridcolor: "#e5e7eb",
                      zerolinecolor: "#e5e7eb",
                    },
                    yaxis: {
                      title: "Velocity (m/s)",
                      range: [0, 1.5],
                      gridcolor: "#e5e7eb",
                      zerolinecolor: "#e5e7eb",
                    },
                    shapes: [
                      {
                        type: "line",
                        x0: -0.5,
                        x1: numReps - 0.5,
                        y0: minVelocity,
                        y1: minVelocity,
                        line: {
                          color: "rgba(74, 123, 252, 0.8)",
                          width: 5,
                        },
                      },
                      {
                        type: "line",
                        x0: -0.5,
                        x1: numReps - 0.5,
                        y0: maxVelocity,
                        y1: maxVelocity,
                        line: {
                          color: "rgba(74, 123, 252, 0.8)",
                          width: 5,
                        },
                      },
                    ],
                  }}
                  config={{
                    displayModeBar: false,
                    responsive: true,
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              {/* Legend */}
              <div className={styles.graphLegend}>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: "#EF4444" }}
                  ></span>
                  Below Target
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: "#22C55E" }}
                  ></span>
                  Within Target
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: "#F59E0B" }}
                  ></span>
                  Above Target
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
      <Toaster position="bottom-right" />
    </Suspense>
  );
}
