import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/locationService.js';
import { ValidationService } from '../services/validationService.js';
import { locationUpdateSchema } from 'shared';
import { AppError } from '../utils/appError.js';

export class LocationController {
  /**
   * PATCH /users/me/locations
   * Update home or current locations & visibility
   */
  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(locationUpdateSchema, req.body);

      const updatedUser = await locationService.updateLocations(req.user.userId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Location profiles updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users/nearby
   * Proximity query to search nearby players
   */
  findNearbyAthletes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lon = parseFloat(req.query.lon as string);
      const lat = parseFloat(req.query.lat as string);
      const radius = parseFloat(req.query.radius as string) || 5000; // default 5km (5000m)
      const sportId = req.query.sportId as string;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      if (isNaN(lon) || isNaN(lat)) {
        throw new AppError(
          'Query parameters lon (longitude) and lat (latitude) are required and must be numbers.',
          400
        );
      }

      const athletes = await locationService.findNearbyAthletes(lon, lat, radius, {
        page,
        limit,
        sportId,
      });

      res.status(200).json({
        success: true,
        count: athletes.length,
        data: athletes,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const locationController = new LocationController();
