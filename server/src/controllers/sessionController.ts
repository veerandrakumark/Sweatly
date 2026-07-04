import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/sessionService.js';
import { ValidationService } from '../services/validationService.js';
import { sessionCreateSchema } from 'shared';
import { AppError } from '../utils/appError.js';

export class SessionController {
  /**
   * POST /sessions
   * Schedule a new live drop-in session
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(sessionCreateSchema, req.body);
      const session = await sessionService.createSession(req.user.userId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Live session scheduled successfully.',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /sessions/:id
   * Fetch single session details
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await sessionService.getSessionById(req.params.id);
      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /sessions/:id/join
   * Join a live drop-in session (respects capacity bounds)
   */
  join = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const session = await sessionService.joinSession(req.params.id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Successfully joined live session.',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /sessions/:id/leave
   * Leave a live drop-in session
   */
  leave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const session = await sessionService.leaveSession(req.params.id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Successfully left live session.',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /sessions/:id/cancel
   * Cancel session (requires host authority)
   */
  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const session = await sessionService.cancelSession(req.params.id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Live session cancelled successfully.',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /sessions/nearby
   * Find drop-in sessions near coordinates
   */
  getNearbySessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000;
      const sportId = req.query.sportId as string;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      if (lon === undefined || lat === undefined) {
        throw new AppError('Longitude (lon) and latitude (lat) are required parameters.', 400);
      }

      const sessions = await sessionService.getNearbySessions(lon, lat, radius, {
        page,
        limit,
        sportId,
      });

      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /sessions/upcoming
   * List upcoming drop-in sessions
   */
  getUpcomingSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sportId = req.query.sportId as string;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const sessions = await sessionService.getUpcomingSessions({
        page,
        limit,
        sportId,
      });

      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /sessions/popular
   * List popular sessions ordered by player occupancy
   */
  getPopularSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sportId = req.query.sportId as string;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const sessions = await sessionService.getPopularSessions({
        page,
        limit,
        sportId,
      });

      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const sessionController = new SessionController();
