import { Schema, model, Types } from 'mongoose';
import { IBaseDocument, softDeletePlugin } from './baseSchema.js';

export interface ISportDetail {
  sportId: Types.ObjectId;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  experienceLevel: '0-1 years' | '1-3 years' | '3-5 years' | '5+ years';
  playingPosition?: string;
}

export interface ISportsProfile {
  favoriteSports: Types.ObjectId[];
  primarySport?: Types.ObjectId;
  sportsDetails: ISportDetail[];
  preferredPlayingTime: string[];
  availability: string[];
  fitnessInterests: string[];
}

export interface IPrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showLocation: boolean;
  showStatistics: boolean;
  showOnlineStatus: boolean;
  showActivityHistory: boolean;
}

export interface IUserStatistics {
  totalActivities: number;
  sportsPlayedCount: number;
  weeklyActivities: number;
  currentStreak: number;
  longestStreak: number;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
}

export interface IGeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IUser extends IBaseDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: 'User' | 'Admin';
  preferredSports: Types.ObjectId[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  location: IGeoJSONPoint;
  avatarUrl?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Profile Fields
  username: string;
  bio?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
  dateOfBirth?: Date;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredLanguage: string;
  timezone: string;

  // Sports Profile
  sportsProfile: ISportsProfile;

  // Locations
  currentLocation?: IGeoJSONPoint;
  homeLocation?: IGeoJSONPoint;
  locationVisibility: 'public' | 'private' | 'friends';

  // Privacy Settings
  privacySettings: IPrivacySettings;

  // Statistics
  statistics: IUserStatistics;

  // Online Presence
  onlineStatus: boolean;
  lastSeen: Date;

  comparePassword(candidatePassword: string): Promise<boolean>; // Instance method template
}

const sportDetailSchema = new Schema<ISportDetail>(
  {
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: true,
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    experienceLevel: {
      type: String,
      enum: ['0-1 years', '1-3 years', '3-5 years', '5+ years'],
      default: '0-1 years',
    },
    playingPosition: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const sportsProfileSchema = new Schema<ISportsProfile>(
  {
    favoriteSports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sport',
      },
    ],
    primarySport: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: false,
    },
    sportsDetails: [sportDetailSchema],
    preferredPlayingTime: {
      type: [String],
      default: [],
    },
    availability: {
      type: [String],
      default: [],
    },
    fitnessInterests: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const privacySettingsSchema = new Schema<IPrivacySettings>(
  {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public',
    },
    showLocation: {
      type: Boolean,
      default: true,
    },
    showStatistics: {
      type: Boolean,
      default: true,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
    showActivityHistory: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const userStatisticsSchema = new Schema<IUserStatistics>(
  {
    totalActivities: { type: Number, default: 0 },
    sportsPlayedCount: { type: Number, default: 0 },
    weeklyActivities: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    friendsCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const pointSchema = new Schema<IGeoJSONPoint>(
  {
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
  { _id: false }
);

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

    // New profile fields
    username: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'],
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    preferredLanguage: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    sportsProfile: {
      type: sportsProfileSchema,
      default: () => ({
        favoriteSports: [],
        sportsDetails: [],
        preferredPlayingTime: [],
        availability: [],
        fitnessInterests: [],
      }),
    },
    currentLocation: {
      type: pointSchema,
      required: false,
    },
    homeLocation: {
      type: pointSchema,
      required: false,
    },
    locationVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public',
    },
    privacySettings: {
      type: privacySettingsSchema,
      default: () => ({
        profileVisibility: 'public',
        showLocation: true,
        showStatistics: true,
        showOnlineStatus: true,
        showActivityHistory: true,
      }),
    },
    statistics: {
      type: userStatisticsSchema,
      default: () => ({
        totalActivities: 0,
        sportsPlayedCount: 0,
        weeklyActivities: 0,
        currentStreak: 0,
        longestStreak: 0,
        followersCount: 0,
        followingCount: 0,
        friendsCount: 0,
      }),
    },
    onlineStatus: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
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

// Set geospatial indexes for proximity searches
userSchema.index({ location: '2dsphere' });
userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ homeLocation: '2dsphere' });
userSchema.index({ username: 1 });

// Virtual field for profile URL
userSchema.virtual('profileUrl').get(function () {
  return `/users/${this._id}`;
});

// Hook to auto-generate a unique default username if none is supplied
userSchema.pre('save', function (next) {
  if (!this.username) {
    const namePart = this.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.username = `${namePart}_${randomSuffix}`;
  }
  next();
});

// Simulated password validation instance method stub
userSchema.methods.comparePassword = async function (_candidatePassword: string): Promise<boolean> {
  // Stub template for bcrypt password verification
  return true;
};

export const User = model<IUser>('User', userSchema);
