import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activityService.js';
import { ValidationService } from '../services/validationService.js';
import { imageService } from '../services/imageService.js';
import { activityCreateSchema, activityUpdateSchema } from 'shared';
import { AppError } from '../utils/appError.js';

export class ActivityController {
  /**
   * POST /activities
   * Create a new activity
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(activityCreateSchema, req.body);
      const activity = await activityService.createActivity(req.user.userId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Activity created successfully.',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /activities/:id
   * Update activity details (requires host ownership)
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(activityUpdateSchema, req.body);
      const activity = await activityService.updateActivity(
        req.params.id,
        req.user.userId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Activity updated successfully.',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /activities/:id
   * Soft-delete activity (requires host ownership)
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      await activityService.deleteActivity(req.params.id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Activity deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/:id
   * Get details of a single activity
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await activityService.getActivityById(req.params.id);
      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities
   * List activities with filters, sorting, and pagination
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const sportId = req.query.sportId as string;
      const activityType = req.query.activityType as string;
      const status = req.query.status as string;
      const hostId = req.query.hostId as string;
      const query = req.query.query as string;
      const visibility = req.query.visibility as string;

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const activities = await activityService.getFilteredActivities(
        {
          sportId,
          activityType,
          status,
          hostId,
          startDate,
          endDate,
          query,
          visibility,
        },
        { page, limit }
      );

      res.status(200).json({
        success: true,
        count: activities.length,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /activities/:id/join
   * Join activity (RSVP)
   */
  join = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const activity = await activityService.joinActivity(req.params.id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Successfully joined the activity.',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /activities/:id/leave
   * Leave activity (Cancel RSVP)
   */
  leave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const activity = await activityService.leaveActivity(req.params.id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Successfully left the activity.',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /activities/media
   * Upload multiple media files
   */
  uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded.', 400);
      }

      const uploadedUrls: string[] = [];
      for (const file of req.files) {
        const url = await imageService.uploadAvatar(file);
        uploadedUrls.push(url);
      }

      res.status(200).json({
        success: true,
        message: 'Photos uploaded successfully.',
        urls: uploadedUrls,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const activityController = new ActivityController();
