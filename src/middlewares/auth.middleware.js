import AppError from '../utils/error/appError.js';
import catchAsync from '../utils/error/catchAsync.js';
import {
  extractBearerToken,
  verifyToken,
} from '../utils/auth/jwt.util.js';

const isAuthenticated = catchAsync(async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  const token = extractBearerToken(authHeader);

  const decoded = await verifyToken(token);

  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
  };

  next();
});

const needVerify = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new AppError('يرجى تأكيد البريد الإلكتروني أولاً', 403));
  }
  next();
};

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('ليس لديك صلاحية لتنفيذ هذا الإجراء', 403));
    }
    next();
  };

export { isAuthenticated, needVerify, restrictTo };
