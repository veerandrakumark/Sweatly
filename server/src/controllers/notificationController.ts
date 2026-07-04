import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';
import { ValidationService } from '../services/validationService.js';
import { notificationQuerySchema, NotificationQueryInput } from 'shared';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List paginated notifications for the logged-in user
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedQuery = ValidationService.validate(
        notificationQuerySchema,
        req.query
      ) as NotificationQueryInput;
      const notifications = await notificationService.getUserNotifications(
        req.user.userId,
        validatedQuery.page,
        validatedQuery.limit
      );

      res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notifications count
   */
  unreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const count = await notificationService.getUnreadCount(req.user.userId);

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid notification ID.', 400);
      }

      const notification = await notificationService.markAsRead(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read for current user
   */
  markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      await notificationService.markAllAsRead(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/notifications/:id
   * Soft-delete a single notification
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid notification ID.', 400);
      }

      const notification = await notificationService.deleteNotification(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
