import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import AppError from '../error/appError.js';

const publicKey = fs.readFileSync(
  path.join(process.cwd(), 'src', 'utils', 'auth', 'publicKey.pem'),
  'utf-8',
);

const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('يجب تسجيل الدخول أولاً', 401);
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('التوكن غير صالح', 401);
  }

  return token;
};

const verifyToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'auth-service',
    });

    return decoded;
  } catch {
    throw new AppError('التوكن غير صالح أو انتهت صلاحيته', 401);
  }
};

export { extractBearerToken, verifyToken };
