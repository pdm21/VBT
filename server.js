const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store the current active page
let currentPage = '/';

io.on('connection', (socket) => {
  console.log('Client connected');

  // Send current page to newly connected clients
  socket.emit('navigate', currentPage);

  // Handle navigation events
  socket.on('navigate', (path) => {
    currentPage = path;
    // Broadcast to all clients except sender
    socket.broadcast.emit('navigate', path);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 