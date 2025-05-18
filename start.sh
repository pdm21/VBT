#!/bin/bash

# Set fixed IP address
IP="192.168.0.100"

# Remove any existing server ready signal file
rm -f .server-ready

# Kill any process using port 3001
echo "Checking for existing processes on port 3001..."
PID=$(lsof -n -i :3001 | awk 'NR>1 {print $2}' | uniq)
if [ -n "$PID" ]; then
    echo "Killing process on port 3001 (PID: $PID)..."
    kill -9 $PID
else
    echo "No existing process on port 3001."
fi

# Kill any process using port 8000
echo "Checking for existing processes on port 8000..."
PID=$(lsof -n -i :8000 | awk 'NR>1 {print $2}' | uniq)
if [ -n "$PID" ]; then
    echo "Killing process on port 8000 (PID: $PID)..."
    kill -9 $PID
else
    echo "No existing process on port 8000."
fi

# Update config.js with current IP
sed -i '' "s/serverIp: '.*'/serverIp: '$IP'/" config.js

# Make logs
mkdir -p logs

# === Start Backend ===
echo "Starting backend on port 8000..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Update .env.local with current IP
echo "NEXT_PUBLIC_SERVER_IP=$IP" > frontend/.env.local

# Output URL in a specific format for Automator to parse
echo "SERVER_URL=http://$IP:3001"

# Start the server in production mode in the background
npm run start:prod &

# Wait for server to be ready
echo "Waiting for server to be ready..."
while [ ! -f .server-ready ]; do
    sleep 1
done

# Clean up the ready signal file
rm .server-ready

# Open the browser (this will be handled by Automator)
echo "Server is ready!"
osascript -e "display notification \"Please open the following link on your ipad: http://$IP:3001\""
# open "http://$IP:3001"
