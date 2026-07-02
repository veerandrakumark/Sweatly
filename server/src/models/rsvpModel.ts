import { Schema, model, Types } from 'mongoose';
import { IBaseDocument } from './baseSchema.js';

export interface IRSVP extends IBaseDocument {
  userId: Types.ObjectId;
  activityId: Types.ObjectId;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const rsvpSchema = new Schema<IRSVP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee one RSVP mapping record per user per activity
rsvpSchema.index({ activityId: 1, userId: 1 }, { unique: true });

export const RSVP = model<IRSVP>('RSVP', rsvpSchema);
