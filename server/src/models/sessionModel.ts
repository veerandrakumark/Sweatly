import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface ILiveSession extends IBaseDocument {
  hostId: Types.ObjectId;
  title: string;
  description?: string;
  sportsGroundId?: Types.ObjectId | null;
  sportId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  maxPlayers: number;
  currentPlayers: Types.ObjectId[];
  status: 'active' | 'cancelled' | 'completed';
  visibility: 'public' | 'private' | 'friends';
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    sportsGroundId: {
      type: Schema.Types.ObjectId,
      ref: 'SportsGround',
      default: null,
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'Sport reference is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: any, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after the start time',
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords: number[]) => {
            return coords.length === 2 && Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90;
          },
          message: 'Coordinates must be valid [longitude, latitude]',
        },
      },
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    maxPlayers: {
      type: Number,
      required: [true, 'Maximum players limit is required'],
      min: [2, 'Maximum players must be at least 2'],
    },
    currentPlayers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
);

// Soft delete
liveSessionSchema.plugin(softDeletePlugin);

// Geospatial indexing
liveSessionSchema.index({ location: '2dsphere', startTime: 1 });
liveSessionSchema.index({ hostId: 1, startTime: -1 });
liveSessionSchema.index({ sportsGroundId: 1 });

export const LiveSession = model<ILiveSession>('LiveSession', liveSessionSchema);
