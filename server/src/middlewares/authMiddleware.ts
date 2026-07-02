/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwtService.js';
import { AppError } from '../utils/appError.js';

// Extend Express Request namespace to support parsed JWT metadata
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication Middleware: Protects private routes by enforcing a valid JWT access token.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing token.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtService.verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token.', 401));
  }
};

/**
 * Optional Authentication Middleware: Parses JWT if present, but does not block request if missing.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwtService.verifyAccessToken(token);
      req.user = decoded;
    }
  } catch {
    // Fail silently since auth is optional
  }
  next();
};

/**
 * Authorization Middleware (RBAC): Enforces role checks.
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden. Insufficient permissions.', 403));
    }

    next();
  };
};
