import { logSocketInfo } from '../utils/socketLogger.js';

const registerConnectionHandlers = (socket) => {
  const userId = socket.data.user.id;

  socket.join(`user:${userId}`);

  logSocketInfo('connected', {
    userId,
    socketId: socket.id,
  });

  socket.on('disconnected', (reason) => {
    logSocketInfo('disconnected', {
      userId,
      socketId: socket.id,
      reason,
    });
  });
};

export default registerConnectionHandlers;
