// This script initializes the velocity_data.csv file with zeros
const fs = require('fs');
const path = require('path');

// Get the number of reps from command line arguments or default to 5
const numReps = parseInt(process.argv[2]) || 5;

// Create an array of zeros with length numReps
const zeros = Array(numReps).fill(0).map(() => "0.00");
const initialContent = zeros.join('\n');

// Path to the CSV file in the public directory
const csvPath = path.join(__dirname, 'velocity_data.csv');

// Write the initial content to the file
fs.writeFileSync(csvPath, initialContent);

console.log(`CSV file initialized with ${numReps} zeros.`); 