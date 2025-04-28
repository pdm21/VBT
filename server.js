const express = require('express');
const next = require('next');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('./config');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './frontend' });
const handle = app.getRequestHandler();

// Track connected clients and their roles
const clients = new Map();

// Function to get all non-internal IP addresses
function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface || []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push(addr.address);
      }
    }
  }
  
  return addresses;
}

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000, // Increase ping timeout
    pingInterval: 25000 // Increase ping interval
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    const deviceType = socket.handshake.query.deviceType || 'client';
    clients.set(socket.id, { deviceType });

    // Handle session state changes (like navigation)
    socket.on('sessionState', (state) => {
      socket.broadcast.emit('sessionState', state);
    });

    // Handle reset requests
    socket.on('reset_request', () => {
      socket.broadcast.emit('reset_request');
    });

    // Handle velocity updates
    socket.on('velocity_update', (data) => {
      socket.broadcast.emit('velocity_update', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      clients.delete(socket.id);
    });

    // Handle reconnection
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Arduino Serial Port setup
  let port;
  try {
    port = new SerialPort({
      path: config.arduinoPort,
      baudRate: 9600,
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (data) => {
      try {
        const [deviceId, velocity] = data.trim().split(',').map(Number);
        
        if (!isNaN(deviceId) && !isNaN(velocity)) {
          io.emit('velocity_update', {
            deviceId,
            velocity
          });
        }
      } catch (error) {
        console.error('Error parsing Arduino data:', error);
      }
    });

    port.on('error', (err) => {
      console.error('Arduino port error:', err.message);
    });
  } catch (error) {
    console.error('Failed to connect to Arduino:', error.message);
    console.log('The server will continue running, but Arduino data will not be available');
  }

  // Express routes
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start server
  server.listen(config.port, '0.0.0.0', (err) => {
    if (err) throw err;
    
    const networkIPs = getNetworkIPs();
    console.log('\nServer is accessible at:');
    networkIPs.forEach(ip => {
      console.log(`http://${ip}:${config.port}`);
    });
    
    console.log('\nTo access from other devices on the same network:');
    console.log('1. Make sure you\'re connected to the same WiFi network');
    console.log(`2. Open any of the above URLs in your browser`);
  });
});