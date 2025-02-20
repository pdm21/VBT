"use client";
import Plot from "react-plotly.js";

interface VelocityBarProps {
  velocity: number;
  vmin?: number;
  vmax?: number;
}

export default function VelocityBar({ velocity, vmin = 0.05, vmax = 0.15 }: VelocityBarProps) {
  const color = velocity >= vmin && velocity <= vmax ? "green" : "red";

  return (
    <Plot
      data={[
        {
          x: ["Velocity"],
          y: [velocity],
          type: "bar",
          marker: { color: color },
          width: [0.3], // Narrow bar
        },
      ]}
      layout={{
        title: "Velocity Indicator",
        yaxis: { title: "Velocity (m/s)", range: [0, vmax * 1.5] },
        xaxis: { showticklabels: false },
        width: 250,
        height: 250,
      }}
      config={{ staticPlot: true }} // Disables interactivity
    />
  );
}

