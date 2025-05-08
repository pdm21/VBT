#!/bin/bash

# Get the Mac's IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Update config.js with current IP
sed -i '' "s/serverIp: '.*'/serverIp: '$IP'/" config.js

# Update .env.local with current IP
echo "NEXT_PUBLIC_SERVER_IP=$IP" > frontend/.env.local

# Output URL in a specific format for Automator to parse
echo "SERVER_URL=http://$IP:3001"

# Start the server in production mode in the background
npm run start:prod &

# Wait for server to start (adjust the sleep duration if needed)
sleep 5

# Open the browser (this will be handled by Automator)
echo "Server is ready!"
