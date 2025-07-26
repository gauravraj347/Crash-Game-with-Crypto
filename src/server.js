// Entry point for Crypto Crash backend
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const CrashGame = require('./game/crashGame');
const playerRoutes = require('./routes/playerRoutes');
const gameRoutes = require('./routes/gameRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { setCrashGameInstance } = require('../src/controllers/gameController');

// API routes
app.use('/api/player', playerRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/transactions', transactionRoutes);

// Initialize CrashGame and wire to controller
let crashGame;
io.on('connection', (socket) => {
  // Handle WebSocket cashout requests
  socket.on('cashout', async ({ playerId }) => {
    try {
      const result = await crashGame.cashOut(playerId);
      socket.emit('cashout_success', result);
    } catch (err) {
      socket.emit('cashout_error', { error: err.message });
    }
  });
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crypto_crash';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    crashGame = new CrashGame(io);
    setCrashGameInstance(crashGame);
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, server, io };
