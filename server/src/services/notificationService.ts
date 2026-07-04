import { NotificationRepository } from '../repositories/notificationRepository.js';
import { INotification } from '../models/notificationModel.js';
import { eventBus } from '../utils/eventBus.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor(notificationRepo = new NotificationRepository()) {
    this.notificationRepo = notificationRepo;
  }

  /**
   * Create and persist a new notification, then publish it via EventBus
   */
  async createNotification(
    userId: string,
    type: 'like' | 'comment' | 'invite' | 'rsvp' | 'friend_request' | 'system',
    title: string,
    message: string,
    targetId?: string
  ): Promise<INotification> {
    const notificationData = {
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      targetId: targetId ? new Types.ObjectId(targetId) : undefined,
      isRead: false,
    };

    const notification = await this.notificationRepo.create(notificationData);

    // Publish event for realtime socket delivery
    eventBus.publish('notification:created', notification);

    return notification;
  }

  /**
   * Retrieve list of paginated notifications for a user
   */
  async getUserNotifications(
    userId: string,
    page: number,
    limit: number
  ): Promise<INotification[]> {
    return this.notificationRepo.getNotificationsByUser(userId, page, limit);
  }

  /**
   * Get unread notification counts
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    const notification = await this.notificationRepo.markAsRead(userId, notificationId);
    if (!notification) {
      throw new AppError('Notification not found or access denied.', 404);
    }
    return notification;
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);
  }

  /**
   * Soft-delete a user notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<INotification> {
    const notification = await this.notificationRepo.deleteNotification(userId, notificationId);
    if (!notification) {
      throw new AppError('Notification not found or access denied.', 404);
    }
    return notification;
  }
}

export const notificationService = new NotificationService();
