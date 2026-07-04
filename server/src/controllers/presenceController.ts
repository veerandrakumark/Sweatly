import { Request, Response, NextFunction } from 'express';
import { presenceService } from '../services/presenceService.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';

export class PresenceController {
  /**
   * GET /api/v1/presence/:userId
   * Query online presence status and last seen timestamp of a user
   */
  getUserPresence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid User ID format.', 400);
      }

      const presence = await presenceService.getUserPresence(userId);
      if (!presence) {
        throw new AppError('User not found.', 404);
      }

      res.status(200).json({
        success: true,
        data: presence,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const presenceController = new PresenceController();
