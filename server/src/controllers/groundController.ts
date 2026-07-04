import { Request, Response, NextFunction } from 'express';
import { groundService } from '../services/groundService.js';
import { ValidationService } from '../services/validationService.js';
import { sportsGroundCreateSchema } from 'shared';
import { AppError } from '../utils/appError.js';

export class GroundController {
  /**
   * POST /grounds
   * Register a new sports ground facility
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = ValidationService.validate(sportsGroundCreateSchema, req.body);
      const ground = await groundService.createGround(validatedData);

      res.status(201).json({
        success: true,
        message: 'Sports ground registered successfully.',
        data: ground,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /grounds/:id
   * Fetch a single sports ground details
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ground = await groundService.getGroundById(req.params.id);
      res.status(200).json({
        success: true,
        data: ground,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /grounds/nearby
   * Find grounds near coordinates
   */
  getNearbyGrounds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000; // default 5km
      const sportId = req.query.sportId as string;
      const category = req.query.category as string;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      if (lon === undefined || lat === undefined) {
        throw new AppError('Longitude (lon) and latitude (lat) are required parameters.', 400);
      }

      const grounds = await groundService.getNearbyGrounds(lon, lat, radius, {
        page,
        limit,
        sportId,
        category,
      });

      res.status(200).json({
        success: true,
        count: grounds.length,
        data: grounds,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /grounds
   * List facilities with filters and text search
   */
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string;
      const sportId = req.query.sportId as string;
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const grounds = await groundService.searchGrounds(
        { category, sportId, query },
        { page, limit }
      );

      res.status(200).json({
        success: true,
        count: grounds.length,
        data: grounds,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const groundController = new GroundController();
