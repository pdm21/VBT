#!/bin/bash

echo "=== Starting VBT Launcher ==="

# Dynamically determine the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Script directory: $SCRIPT_DIR"

# Load NVM
echo "Loading NVM..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the correct Node version
echo "Setting Node version to 20.18.3..."
nvm use 20.18.3 > /dev/null 2>&1

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
PROJECT_DIR="$SCRIPT_DIR"
echo "Project directory: $PROJECT_DIR"

# Function to check if server is responding
check_server() {
    local ip="$1"
    local port="$2"
    echo "Checking server at $ip:$port..."
    # Increased timeout to 3 seconds and added verbose output
    nc -z -w3 -v "$ip" "$port" 2>&1
    local result=$?
    if [ $result -eq 0 ]; then
        echo "Successfully connected to $ip:$port"
    else
        echo "Failed to connect to $ip:$port (Error code: $result)"
    fi
    return $result
}

# Function to get all active IP addresses
get_ips() {
    echo "Getting active IP addresses..."
    # More robust IP detection that excludes virtual interfaces
    ifconfig | grep "inet " | grep -v 127.0.0.1 | grep -v "169.254" | awk '{print $2}'
}

# Function to validate IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        IFS='.' read -r -a ip_parts <<< "$ip"
        for part in "${ip_parts[@]}"; do
            if [ "$part" -gt 255 ] || [ "$part" -lt 0 ]; then
                return 1
            fi
        done
        return 0
    fi
    return 1
}

# Kill any existing Node.js servers
echo "Cleaning up any existing Node.js servers..."
pkill -f "node server.js" || true

# Change to the project directory
echo "Changing to project directory..."
cd "$PROJECT_DIR" || {
    osascript -e 'display notification "Could not find project directory" with title "VBT Launcher Error"'
    exit 1
}

# Create logs directory if it doesn't exist
echo "Setting up logs directory..."
mkdir -p logs

# ====================================================
echo "=== Starting Backend Server ==="
# ====================================================

cd backend
echo "Starting uvicorn server on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"
cd ..

# ====================================================
echo "=== Starting Frontend Server ==="
# ====================================================

# Get all IP addresses
echo "Detecting available IP addresses..."
IPS=($(get_ips))
echo "Found IP addresses: ${IPS[*]}"

# Update config with first valid IP
IP=""
for potential_ip in "${IPS[@]}"; do
    if validate_ip "$potential_ip"; then
        IP="$potential_ip"
        break
    fi
done

if [ -z "$IP" ]; then
    echo "No valid IP address found!"
    osascript -e 'display notification "No valid IP address found" with title "VBT Launcher Error"'
    exit 1
fi

echo "Using primary IP: $IP"
sed -i '' "s/serverIp: '.*'/serverIp: '$IP'/" config.js
echo "NEXT_PUBLIC_SERVER_IP=$IP" > frontend/.env.local

# Start the server with logging
echo "Starting frontend server..."
npm run start:prod > logs/server.log 2>&1 &
SERVER_PID=$!
echo "Frontend server started with PID: $SERVER_PID"

# Show loading notification
osascript -e 'display notification "Starting VBT Server..." with title "VBT Launcher"'

# Wait for server to be ready (try for 30 seconds)
echo "Waiting for server to be ready..."
success=false
for i in {1..15}; do
    echo "Attempt $i of 15..."
    # Try each IP address
    for current_ip in "${IPS[@]}"; do
        if check_server "$current_ip" 3001; then
            IP="$current_ip"
            success=true
            echo "Server is responding on $IP:3001"
            break 2
        fi
    done
    
    # Check if process is still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "Server process died. Check logs/server.log for details."
        osascript -e 'display notification "Server failed to start. Check logs for details." with title "VBT Launcher Error"'
        exit 1
    fi
    
    sleep 2
done

if [ "$success" = true ]; then
    # Server is ready, open in default browser
    echo "Server is ready! Opening browser..."
    open "http://$IP:3001"
    osascript -e 'display notification "Server is ready!" with title "VBT Launcher"'
    exit 0
else
    # If we get here, server failed to start
    echo "Failed to connect to server after all attempts"
    kill $SERVER_PID 2>/dev/null
    osascript -e 'display notification "Could not connect to server. Check logs for details." with title "VBT Launcher Error"'
    exit 1
fi