import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface IOpeningHour {
  day: string; // e.g. "Monday", "Tuesday", etc.
  open: string; // e.g. "08:00"
  close: string; // e.g. "22:00"
}

export interface ISportsGround extends IBaseDocument {
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  supportedSports: Types.ObjectId[];
  category: string;
  openingHours: IOpeningHour[];
  facilities: string[];
  averageRating: number;
  ratingCount: number;
  images: string[];
}

const openingHourSchema = new Schema<IOpeningHour>(
  {
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
  },
  { _id: false }
);

const sportsGroundSchema = new Schema<ISportsGround>(
  {
    name: {
      type: String,
      required: [true, 'Sports ground name is required'],
      trim: true,
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
      required: [true, 'Sports ground address is required'],
      trim: true,
    },
    supportedSports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sport',
      },
    ],
    category: {
      type: String,
      required: [true, 'Sports ground category is required'],
      trim: true,
    },
    openingHours: {
      type: [openingHourSchema],
      default: [],
    },
    facilities: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Apply soft-delete plugin
sportsGroundSchema.plugin(softDeletePlugin);

// Geospatial index for proximity searches
sportsGroundSchema.index({ location: '2dsphere' });
sportsGroundSchema.index({ supportedSports: 1 });

export const SportsGround = model<ISportsGround>('SportsGround', sportsGroundSchema);
