import express from 'express';
import morgan from 'morgan';
import AppError from './src/utils/error/appError.js';
import globalErrorHandler from './src/middlewares/globalErrorHandler.js';

const app = express();

app.enable('trust proxy');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

app.use(express.json({ limit: '50kb' }));

app.use((req, res, next) => {
  next(new AppError(`المسار ${req.originalUrl} غير موجود`, 404));
});

app.use(globalErrorHandler);

export default app;
