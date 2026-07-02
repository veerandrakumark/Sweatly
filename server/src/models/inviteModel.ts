import { Schema, model, Types } from 'mongoose';
import { IBaseDocument } from './baseSchema.js';

export interface IInvite extends IBaseDocument {
  activityId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
}

const inviteSchema = new Schema<IInvite>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity reference is required'],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver reference is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee one active pending invitation mapping per invitee per activity
inviteSchema.index({ activityId: 1, receiverId: 1 }, { unique: true });

export const Invite = model<IInvite>('Invite', inviteSchema);
