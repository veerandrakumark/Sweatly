import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface IWeatherInfo {
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
}

export interface IActivity extends IBaseDocument {
  hostId: Types.ObjectId;
  title: string;
  sportId: Types.ObjectId;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  maxCapacity: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  rsvpCount: number;

  // New fields
  activityType: string;
  duration: number; // in minutes
  distance?: number; // in km
  calories?: number; // in kcal
  visibility: 'public' | 'private' | 'friends';
  participants: Types.ObjectId[];
  media: string[];
  tags: string[];
  completionStatus: 'pending' | 'completed' | 'cancelled';
  weather?: IWeatherInfo;
  likesCount: number;
  commentsCount: number;
}

const weatherSchema = new Schema<IWeatherInfo>(
  {
    temperature: { type: Number, required: false },
    condition: { type: String, required: false },
    humidity: { type: Number, required: false },
    windSpeed: { type: Number, required: false },
  },
  { _id: false }
);

const activitySchema = new Schema<IActivity>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'Sport reference is required'],
    },
    description: {
      type: String,
      required: false,
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
      required: [true, 'Physical address is required'],
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 10,
      min: [2, 'Minimum capacity is 2 players'],
      max: [100, 'Maximum capacity is 100 players'],
    },
    status: {
      type: String,
      enum: ['open', 'full', 'cancelled', 'completed'],
      default: 'open',
    },
    rsvpCount: {
      type: Number,
      default: 1,
    },

    // New profile fields
    activityType: {
      type: String,
      required: [true, 'Activity type is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    distance: {
      type: Number,
      required: false,
      min: [0, 'Distance cannot be negative'],
    },
    calories: {
      type: Number,
      required: false,
      min: [0, 'Calories cannot be negative'],
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public',
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    media: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    completionStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    weather: {
      type: weatherSchema,
      required: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Apply soft-delete plugin
activitySchema.plugin(softDeletePlugin);

// Combined compound geospatial index for feeds and filters
activitySchema.index({ location: '2dsphere', startTime: -1, sportId: 1 });
activitySchema.index({ hostId: 1, startTime: -1 });

export const Activity = model<IActivity>('Activity', activitySchema);
