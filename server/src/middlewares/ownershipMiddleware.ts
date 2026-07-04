import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { Activity } from '../models/activityModel.js';
import { Comment } from '../models/commentModel.js';

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

/**
 * Middleware to authorize only the host of the activity or an Admin.
 */
export const requireActivityHost = (paramName: string = 'id') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const activityId = req.params[paramName];
      const activity = await Activity.findById(activityId);
      if (!activity) {
        throw new AppError('Activity not found.', 404);
      }

      const isHost = activity.hostId.toString() === req.user.userId;
      const isAdmin = req.user.role === 'Admin';

      if (!isHost && !isAdmin) {
        throw new AppError(
          'Forbidden. You must be the host of this activity to perform this action.',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to authorize only the author of the comment or an Admin.
 */
export const requireCommentAuthor = (paramName: string = 'id') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const commentId = req.params[paramName];
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found.', 404);
      }

      const isAuthor = comment.userId.toString() === req.user.userId;
      const isAdmin = req.user.role === 'Admin';

      if (!isAuthor && !isAdmin) {
        throw new AppError(
          'Forbidden. You must be the author of this comment to perform this action.',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
