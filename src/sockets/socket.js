import { Server } from 'socket.io';
import socketAuth from './middleware/socketAuth.js';
import registerConnectionHandlers from './handlers/connection.handler.js';
import { logSocketError } from './utils/socketLogger.js';

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    registerConnectionHandlers(socket);
  });

  io.on('error', (error) => {
    logSocketError('server error', {
      message: error.message,
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized.');
  }

  return io;
};

export { initSocket, getIO };
