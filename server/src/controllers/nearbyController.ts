import { Request, Response, NextFunction } from 'express';
import { nearbyService } from '../services/nearbyService.js';
import { ValidationService } from '../services/validationService.js';
import { nearbySearchSchema, NearbySearchInput } from 'shared';

export class NearbyController {
  /**
   * GET /users/nearby
   * Locate athletes matching distance and profile filter parameters.
   */
  findNearbyPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      // Validate inputs using Zod
      const validatedQuery = ValidationService.validate(
        nearbySearchSchema,
        req.query
      ) as NearbySearchInput;

      // Default radius to 10km (10000 meters) if not specified
      const radius = validatedQuery.radius || 10000;

      const players = await nearbyService.findNearbyPlayers(
        validatedQuery.longitude,
        validatedQuery.latitude,
        radius,
        {
          sportId: validatedQuery.sportId,
          skillLevel: validatedQuery.skillLevel,
          gender: validatedQuery.gender,
          ageGroup: validatedQuery.ageGroup,
          availability: validatedQuery.availability,
          onlineStatus: validatedQuery.onlineStatus,
        },
        { page, limit }
      );

      res.status(200).json({
        success: true,
        count: players.length,
        data: players,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const nearbyController = new NearbyController();
