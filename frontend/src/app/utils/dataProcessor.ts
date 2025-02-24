interface RawData {
  acc_x: number;
  acc_y: number;
  acc_z: number;
  gyr_x: number;
  gyr_y: number;
  gyr_z: number;
  adj_acc_x: number;
  adj_acc_y: number;
  adj_acc_z: number;
}

export function processTestData(data: RawData[]): number[] {
  const samplingRate = 100; // 100Hz sampling rate
  const dt = 1 / samplingRate;
  
  let velocities: number[] = [];
  let currentVelocity = 0;
  const velocityThreshold = 0.01; // Reset velocity if movement is very small
  
  for (let i = 1; i < data.length; i++) {
    // Calculate total acceleration magnitude from adjusted values
    const acceleration = Math.sqrt(
      Math.pow(data[i].adj_acc_x, 2) +
      Math.pow(data[i].adj_acc_y, 2) +
      Math.pow(data[i].adj_acc_z, 2)
    );
    
    // Convert acceleration to m/s²
    const accelerationMS2 = acceleration * 9.81;
    
    // Integrate acceleration to get velocity
    currentVelocity += accelerationMS2 * dt;
    
    // Apply stronger decay factor to combat drift
    currentVelocity *= 0.95;
    
    // Reset velocity if movement is minimal (helps prevent drift accumulation)
    if (Math.abs(acceleration) < velocityThreshold) {
      currentVelocity = 0;
    }
    
    // Store velocity
    velocities.push(Math.abs(currentVelocity));
  }
  
  // Scale down the velocities to expected range (typically 0-2 m/s for weight lifting)
  const maxVelocity = Math.max(...velocities);
  const scaledVelocities = velocities.map(v => v * (2.0 / maxVelocity));
  
  return scaledVelocities;
}

// Load the test data
export async function loadTestData() {
  try {
    const response = await fetch('/test_data.csv');
    const text = await response.text();
    
    // Parse CSV
    const rows = text.split('\n')
      .slice(1) // Skip header row
      .filter(row => row.trim()) // Remove empty rows
      .map(row => {
        const columns = row.split(',');
        return {
          acc_x: parseFloat(columns[0]),
          acc_y: parseFloat(columns[1]),
          acc_z: parseFloat(columns[2]),
          gyr_x: parseFloat(columns[3]),
          gyr_y: parseFloat(columns[4]),
          gyr_z: parseFloat(columns[5]),
          adj_acc_x: parseFloat(columns[6]),
          adj_acc_y: parseFloat(columns[7]),
          adj_acc_z: parseFloat(columns[8])
        };
      });
    
    return rows;
  } catch (error) {
    console.error('Error loading test data:', error);
    return [];
  }
} 