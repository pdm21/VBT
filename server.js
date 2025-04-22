const express = require('express');
const next = require('next');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('./config');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './frontend' });
const handle = app.getRequestHandler();

// Track connected clients and their roles
const clients = new Map();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
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
  });

  // Arduino Serial Port setup
  let port;
  try {
    port = new SerialPort({
      path: config.arduinoPort,
      baudRate: 9600,
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    // Handle data from Arduino
    parser.on('data', (data) => {
      try {
        // Assuming the Arduino sends data in the format: "deviceId,velocity"
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
  server.listen(config.port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${config.serverIp}:${config.port}`);
    console.log('To access from iPad or other devices on the same network:');
    console.log(`1. Make sure you're connected to the same WiFi network`);
    console.log(`2. Open http://${config.serverIp}:${config.port} in your browser`);
  });
});