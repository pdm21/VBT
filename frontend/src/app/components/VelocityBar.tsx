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
  
  // Apple Fitness inspired colors
  const colors = displayVelocities.map(velocity => 
    velocity >= minVelocity && velocity <= maxVelocity 
      ? 'rgb(44, 212, 85)' // Apple fitness green for good
      : 'rgb(252, 45, 85)' // Apple fitness red for bad
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
          marker: { 
            color: colors,
            opacity: 0.8,
            line: {
              color: 'rgba(255, 255, 255, 0.2)',
              width: 1
            }
          },
          width: Array(displayVelocities.length).fill(0.65), // Slightly narrower bars for modern look
          hoverinfo: 'y',
        },
      ]}
      layout={{
        title: { text: "" },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        yaxis: { 
          title: "Velocity (m/s)", 
          range: [0, maxVelocity * 1.2],
          titlefont: { 
            size: 12,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          tickfont: { 
            size: 11,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          showgrid: true,
          gridcolor: 'rgba(255, 255, 255, 0.05)',
          zeroline: true,
          zerolinecolor: 'rgba(255, 255, 255, 0.1)'
        },
        xaxis: { 
          title: "Repetition",
          titlefont: { 
            size: 12,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          tickfont: { 
            size: 11,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          showgrid: false
        },
        width: 500,
        height: 120, 
        autosize: true,
        margin: { l: 40, r: 20, t: 20, b: 40 },
        shapes: [
          {
            type: "line",
            x0: -0.5, x1: displayVelocities.length - 0.5,
            y0: minVelocity, y1: minVelocity,
            line: { color: 'rgba(45, 135, 252, 0.8)', width: 2, dash: 'dot' },
          },
          {
            type: "line",
            x0: -0.5, x1: displayVelocities.length - 0.5,
            y0: maxVelocity, y1: maxVelocity,
            line: { color: 'rgba(45, 135, 252, 0.8)', width: 2, dash: 'dot' },
          },
        ],
        annotations: [
          {
            x: displayVelocities.length - 0.5,
            y: minVelocity,
            xref: 'x',
            yref: 'y',
            text: 'Min',
            showarrow: false,
            font: {
              family: 'SF Pro Display, Arial',
              size: 10,
              color: 'rgba(45, 135, 252, 0.9)'
            },
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            borderpad: 2,
            xanchor: 'right',
            yanchor: 'bottom'
          },
          {
            x: displayVelocities.length - 0.5,
            y: maxVelocity,
            xref: 'x',
            yref: 'y',
            text: 'Max',
            showarrow: false,
            font: {
              family: 'SF Pro Display, Arial',
              size: 10,
              color: 'rgba(45, 135, 252, 0.9)'
            },
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            borderpad: 2,
            xanchor: 'right',
            yanchor: 'top'
          }
        ]
      }}
      config={{ 
        staticPlot: true,
        displayModeBar: false
      }}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
