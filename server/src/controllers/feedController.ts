import { Request, Response, NextFunction } from 'express';
import { feedService } from '../services/feedService.js';
import { AppError } from '../utils/appError.js';

export class FeedController {
  /**
   * GET /feed
   * Fetch ranked community activities feed (cursor-paginated)
   */
  getCommunityFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cursor = req.query.cursor as string;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const sportId = req.query.sportId as string;

      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;

      if ((lon !== undefined && lat === undefined) || (lat !== undefined && lon === undefined)) {
        throw new AppError(
          'Both latitude (lat) and longitude (lon) are required for location queries.',
          400
        );
      }

      const feedData = await feedService.getCommunityFeed({
        cursor,
        limit,
        sportId,
        longitude: lon,
        latitude: lat,
        radiusInMeters: radius,
      });

      res.status(200).json({
        success: true,
        data: feedData.activities,
        nextCursor: feedData.nextCursor,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const feedController = new FeedController();
