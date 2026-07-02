import { Schema, model, Types } from 'mongoose';
import { IBaseDocument } from './baseSchema.js';

export interface IFriendRequest extends IBaseDocument {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
}

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
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

// Guarantee one active pending friend request record mapping per user pairing
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export const FriendRequest = model<IFriendRequest>('FriendRequest', friendRequestSchema);
