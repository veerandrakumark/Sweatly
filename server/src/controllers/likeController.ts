import { Request, Response, NextFunction } from 'express';
import { likeService } from '../services/likeService.js';
import { AppError } from '../utils/appError.js';

export class LikeController {
  /**
   * POST /activities/:activityId/like
   * Likes an activity
   */
  likeActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      await likeService.likeActivity(req.user.userId, req.params.activityId);

      res.status(200).json({
        success: true,
        message: 'Activity liked successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /activities/:activityId/like
   * Unlikes an activity
   */
  unlikeActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      await likeService.unlikeActivity(req.user.userId, req.params.activityId);

      res.status(200).json({
        success: true,
        message: 'Activity unliked successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/:activityId/like/status
   * Checks if user liked the activity
   */
  checkUserLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const hasLiked = await likeService.hasUserLiked(req.user.userId, req.params.activityId);

      res.status(200).json({
        success: true,
        hasLiked,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const likeController = new LikeController();
