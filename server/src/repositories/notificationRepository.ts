import { Notification, INotification } from '../models/notificationModel.js';
import { BaseRepository } from './baseRepository.js';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  // Retrieve count of unread notifications for a user
  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isRead: false, isDeleted: false }).exec();
  }

  // Bulk mark notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await this.model
      .updateMany({ userId, isRead: false, isDeleted: false }, { isRead: true })
      .exec();
  }

  // Retrieve paginated list of notifications for a user
  async getNotificationsByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<INotification[]> {
    const skip = (page - 1) * limit;
    return this.model
      .find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  // Mark a single notification as read
  async markAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    return this.model
      .findOneAndUpdate(
        { _id: notificationId, userId, isDeleted: false },
        { isRead: true },
        { new: true }
      )
      .exec();
  }

  // Delete a single notification (soft delete)
  async deleteNotification(userId: string, notificationId: string): Promise<INotification | null> {
    return this.model
      .findOneAndUpdate(
        { _id: notificationId, userId, isDeleted: false },
        { isDeleted: true },
        { new: true }
      )
      .exec();
  }
}
