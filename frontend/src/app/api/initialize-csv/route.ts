import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { content, numReps } = await request.json();
    
    if (content === undefined || numReps === undefined) {
      return NextResponse.json({ error: 'Content and numReps are required' }, { status: 400 });
    }
    
    // Path to the CSV file in the public directory
    const csvPath = path.join(process.cwd(), 'public', 'velocity_data.csv');
    
    // Create content with numReps zeros
    const zeros = Array(numReps).fill("0.00").join('\n');
    
    // Write the content to the file
    fs.writeFileSync(csvPath, zeros);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing CSV:', error);
    return NextResponse.json({ error: 'Failed to initialize CSV' }, { status: 500 });
  }
} 