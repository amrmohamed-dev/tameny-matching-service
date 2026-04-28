import { verifyToken } from '../../utils/auth/jwt.util.js';

const getSocketToken = (socket) => socket.handshake.auth?.token;

const socketAuth = async (socket, next) => {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error('يجب تسجيل الدخول أولاً'));
    }

    const decoded = await verifyToken(token);

    socket.data.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (err) {
    next(new Error('فشل التحقق من المستخدم'));
  }
};

export default socketAuth;
