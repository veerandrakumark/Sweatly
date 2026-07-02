import { Notification, INotification } from '../models/notificationModel.js';
import { BaseRepository } from './baseRepository.js';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  // Retrieve count of unread notifications for a user
  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isRead: false }).exec();
  }

  // Bulk mark notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await this.model.updateMany({ userId, isRead: false }, { isRead: true }).exec();
  }
}
