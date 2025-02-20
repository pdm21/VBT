"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

interface GraphProps {
  repNumber: number;
  velocity: number;
  maxVelocity: number;
  minVelocity: number;
}

export default function Graph({ repNumber, velocity, maxVelocity, minVelocity }: GraphProps) {
  // Determine bar color based on velocity range
  const barColor = velocity >= minVelocity && velocity <= maxVelocity ? "green" : "red";

  // Data for the chart
  const data = [{ rep: repNumber, velocity }];

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="rep" />
          <YAxis domain={[0, maxVelocity + 0.2]} />
          <ReferenceLine y={maxVelocity} stroke="blue" strokeWidth={2} />
          <ReferenceLine y={minVelocity} stroke="blue" strokeWidth={2} />
          <Bar dataKey="velocity" fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

