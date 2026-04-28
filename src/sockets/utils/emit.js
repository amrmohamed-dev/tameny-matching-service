import { getIO } from '../socket.js';

const emitToUser = (userId, event, payload) => {
  const io = getIO();
  io.to(`user:${userId}`).emit(event, payload);
  return true;
};

export default emitToUser;
