import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface IComment extends IBaseDocument {
  activityId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
}

const commentSchema = new Schema<IComment>(
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
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply soft-delete plugin
commentSchema.plugin(softDeletePlugin);

// Index to retrieve chat logs quickly
commentSchema.index({ activityId: 1, createdAt: 1 });

export const Comment = model<IComment>('Comment', commentSchema);
