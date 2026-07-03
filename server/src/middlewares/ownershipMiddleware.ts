import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

/**
 * Middleware to authorize only the owner of the resource or an Admin.
 * @param paramName The route parameter representing the user ID (e.g. 'id')
 */
export const requireOwnership = (paramName: string = 'id') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const resourceId = req.params[paramName];
    const isOwner = req.user.userId === resourceId || resourceId === 'me';
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('Forbidden. You do not own this resource.', 403));
    }

    next();
  };
};
