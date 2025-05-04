#!/bin/bash

# Dynamically determine the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the correct Node version
nvm use 20.18.3 > /dev/null 2>&1

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
PROJECT_DIR="$SCRIPT_DIR"

# Function to check if server is responding
check_server() {
    local ip="$1"
    local port="$2"
    nc -z -w1 "$ip" "$port" 2>/dev/null
    return $?
}

# Function to get all active IP addresses
get_ips() {
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
}

# Kill any existing Node.js servers
pkill -f "node server.js" || true

# Change to the project directory
cd "$PROJECT_DIR" || {
    osascript -e 'display notification "Could not find project directory" with title "VBT Launcher Error"'
    exit 1
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Get all IP addresses
IPS=($(get_ips))

# Update config with first IP (will try others if this fails)
IP="${IPS[0]}"
sed -i '' "s/serverIp: '.*'/serverIp: '$IP'/" config.js
echo "NEXT_PUBLIC_SERVER_IP=$IP" > frontend/.env.local

# Start the server with logging
"$NVM_DIR/versions/node/v20.18.3/bin/npm" run start:prod > logs/server.log 2>&1 &
SERVER_PID=$!

# Show loading notification
osascript -e 'display notification "Starting VBT Server..." with title "VBT Launcher"'

# Wait for server to be ready (try for 30 seconds)
success=false
for i in {1..15}; do
    # Try each IP address
    for current_ip in "${IPS[@]}"; do
        if check_server "$current_ip" 3001; then
            IP="$current_ip"
            success=true
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
    open "http://$IP:3001"
    osascript -e 'display notification "Server is ready!" with title "VBT Launcher"'
    exit 0
else
    # If we get here, server failed to start
    kill $SERVER_PID 2>/dev/null
    osascript -e 'display notification "Could not connect to server. Check logs for details." with title "VBT Launcher Error"'
    exit 1
fi