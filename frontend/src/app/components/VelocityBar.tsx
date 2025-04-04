"use client";
import Plot from "react-plotly.js";

interface VelocityBarProps {
  velocities: number[];
  maxVelocity: number;
  minVelocity: number;
}

export default function VelocityBar({ velocities, maxVelocity, minVelocity }: VelocityBarProps) {
  // Handle empty arrays by creating placeholder data
  const hasData = velocities.length > 0;
  const displayVelocities = hasData ? velocities : [0];
  
  // Create an array of colors based on velocity values
  const colors = displayVelocities.map(velocity => 
    velocity >= minVelocity && velocity <= maxVelocity ? "green" : "red"
  );

  // Create labels for each bar
  const labels = hasData 
    ? displayVelocities.map((_, index) => `Rep ${index + 1}`)
    : ["No Data"];

  return (
    <Plot
      data={[
        {
          x: labels,
          y: displayVelocities,
          type: "bar",
          marker: { color: colors },
          width: Array(displayVelocities.length).fill(0.8), // Wider bars
        },
      ]}
      layout={{
        title: { text: "" },
        yaxis: { 
          title: "Velocity (m/s)", 
          range: [0, maxVelocity * 1.5],
          titlefont: { size: 10 },
          tickfont: { size: 12 }
        },
        xaxis: { 
          title: "Repetition",
          titlefont: { size: 10 },
          tickfont: { size: 12 }
        },
        width: 500,
        height: 110, // Reduced height for smaller container
        autosize: true,
        margin: { l: 30, r: 10, t: 10, b: 30 },
        shapes: [
          {
            type: "line",
            x0: -0.5, x1: displayVelocities.length - 0.5, // Extend across all bars
            y0: minVelocity, y1: minVelocity,
            line: { color: "blue", width: 1},
          },
          {
            type: "line",
            x0: -0.5, x1: displayVelocities.length - 0.5, // Extend across all bars
            y0: maxVelocity, y1: maxVelocity,
            line: { color: "blue", width: 1},
          },
        ],
      }}
      config={{ staticPlot: true }}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
