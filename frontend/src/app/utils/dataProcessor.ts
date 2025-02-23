interface RawData {
  adj_acc_x: number;
  adj_acc_y: number;
  adj_acc_z: number;
}

export function processTestData(data: RawData[]): number[] {
  // Calculate a simulated velocity from the adjusted acceleration values
  // This is a simplified calculation - you may want to adjust based on your needs
  return data.map(row => {
    // Combine the acceleration components to get a magnitude
    const magnitude = Math.sqrt(
      Math.pow(row.adj_acc_x, 2) + 
      Math.pow(row.adj_acc_y, 2) + 
      Math.pow(row.adj_acc_z, 2)
    );
    
    // Scale the magnitude to a reasonable velocity range (0-0.2 to match current simulation)
    return magnitude * 0.2;
  });
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
          adj_acc_x: parseFloat(columns[7]),
          adj_acc_y: parseFloat(columns[8]),
          adj_acc_z: parseFloat(columns[9])
        };
      });
    
    return rows;
  } catch (error) {
    console.error('Error loading test data:', error);
    return [];
  }
} 