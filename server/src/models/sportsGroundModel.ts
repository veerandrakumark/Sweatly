import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface ISportsGround extends IBaseDocument {
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  supportedSports: Types.ObjectId[];
}

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
  },
  {
    timestamps: true,
  }
);

// Apply soft-delete plugin
sportsGroundSchema.plugin(softDeletePlugin);

// Geospatial index for proximity searches
sportsGroundSchema.index({ location: '2dsphere' });

export const SportsGround = model<ISportsGround>('SportsGround', sportsGroundSchema);
