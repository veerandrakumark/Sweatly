import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface IUser extends IBaseDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: 'User' | 'Admin';
  preferredSports: Types.ObjectId[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  avatarUrl?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>; // Instance method template
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['User', 'Admin'],
      default: 'User',
    },
    preferredSports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sport',
      },
    ],
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
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
    avatarUrl: {
      type: String,
      required: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      required: false,
    },
    emailVerificationExpires: {
      type: Date,
      required: false,
    },
    passwordResetToken: {
      type: String,
      required: false,
    },
    passwordResetExpires: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply soft-delete plugin
userSchema.plugin(softDeletePlugin);

// Set geospatial index for proximity search
userSchema.index({ location: '2dsphere' });

// Virtual field for profile URL
userSchema.virtual('profileUrl').get(function () {
  return `/users/${this._id}`;
});

// Simulated password validation instance method stub
userSchema.methods.comparePassword = async function (_candidatePassword: string): Promise<boolean> {
  // Stub template for bcrypt password verification
  return true;
};

export const User = model<IUser>('User', userSchema);
