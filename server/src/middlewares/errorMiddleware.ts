import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error with structured JSON format
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message}`, err, {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    isOperational: err instanceof AppError ? err.isOperational : false,
  });

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
