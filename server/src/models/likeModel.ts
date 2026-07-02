import { Schema, model, Types } from 'mongoose';
import { IBaseDocument } from './baseSchema.js';

export interface ILike extends IBaseDocument {
  activityId: Types.ObjectId;
  userId: Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee one like mapping record per user per activity
likeSchema.index({ activityId: 1, userId: 1 }, { unique: true });

export const Like = model<ILike>('Like', likeSchema);
