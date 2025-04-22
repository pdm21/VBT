#!/bin/bash

# Get the Mac's IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Update config.js with current IP
sed -i '' "s/serverIp: '.*'/serverIp: '$IP'/" config.js

# Update .env.local with current IP
echo "NEXT_PUBLIC_SERVER_IP=$IP" > frontend/.env.local

# Find Arduino port
ARDUINO_PORT=$(ls /dev/tty.usbmodem* 2>/dev/null || ls /dev/tty.usbserial* 2>/dev/null || echo "NOT_FOUND")

if [ "$ARDUINO_PORT" != "NOT_FOUND" ]; then
  # Update Arduino port in config
  sed -i '' "s|arduinoPort: '.*'|arduinoPort: '$ARDUINO_PORT'|" config.js
  echo "Found Arduino at: $ARDUINO_PORT"
else
  echo "Warning: No Arduino device found. Please connect the Arduino and try again."
fi

echo "Server will be available at: http://$IP:3001"
echo "Use this address on your iPad's browser"

# Start the server in production mode
npm run start:prod
