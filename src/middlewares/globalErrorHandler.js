import AppError from '../utils/error/appError.js';

const handleCastErrorDB = (err) => {
  const message = `قيمة غير صحيحة للحقل ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  const message = `القيمة "${value}" مستخدمة بالفعل في ${field}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((v) => v.message);
  const message = `بيانات غير صالحة: ${errors.join(' - ')}`;
  return new AppError(message, 400);
};

const handlejwtError = () =>
  new AppError(
    'التوكن غير صالح أو انتهت صلاحيته، يرجى تسجيل الدخول مرة أخرى',
    401,
  );

const handlejwtExpiredError = () =>
  new AppError(
    'التوكن غير صالح أو انتهت صلاحيته، يرجى تسجيل الدخول مرة أخرى',
    401,
  );

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or unknown error: don't leak error details
  // 1) Log error
  console.error('Error |', err);
  // 2) Send generic message
  return res.status(500).json({
    status: 'error',
    message: 'حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا',
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const { NODE_ENV } = process.env;
  if (NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (NODE_ENV === 'production') {
    let error = Object.create(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000 || error.cause?.code === 11000)
      error = handleDuplicateErrorDB(error.cause || error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handlejwtError();
    if (error.name === 'TokenExpiredError')
      error = handlejwtExpiredError();

    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;
