import { Schema, model } from 'mongoose';
import { IBaseDocument } from './baseSchema.js';

export interface ISport extends IBaseDocument {
  name: string;
  slug: string;
  iconUrl?: string;
}

const sportSchema = new Schema<ISport>(
  {
    name: {
      type: String,
      required: [true, 'Sport name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Sport slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    iconUrl: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
sportSchema.index({ slug: 1 });

export const Sport = model<ISport>('Sport', sportSchema);
