import { Schema, model, Types } from 'mongoose';
import { IBaseDocument } from './baseSchema.js';

export interface INotification extends IBaseDocument {
  userId: Types.ObjectId;
  type: 'invite' | 'rsvp' | 'comment' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  targetId?: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID mapping is required'],
    },
    type: {
      type: String,
      enum: ['invite', 'rsvp', 'comment', 'system'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user feed sorting and unread counts query
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
