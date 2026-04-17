import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import queryString from 'qs';
import xssClean from './src/middlewares/xssClean.js';
import AppError from './src/utils/error/appError.js';
import globalErrorHandler from './src/middlewares/globalErrorHandler.js';

const app = express();

app.enable('trust proxy');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));

app.set('query parser', (query) => queryString.parse(query));

app.use(xssClean);

app.use((req, res, next) => {
  next(new AppError(`المسار ${req.originalUrl} غير موجود`, 404));
});

app.use(globalErrorHandler);

export default app;
