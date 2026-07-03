import { z } from 'zod';

export const APP_METADATA = {
  name: 'Sweatly',
  version: '1.0.0',
  apiVersion: 'v1',
};

// Strict password strength validation regex matching OWASP guidelines
// (Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const passwordValidationSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    passwordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Register validation schema
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address format').trim().toLowerCase(),
  password: passwordValidationSchema,
  preferredSports: z.array(z.string()).min(1, 'Select at least one sport'),
  location: z.object({
    coordinates: z.tuple([
      z.number().min(-180).max(180), // Longitude
      z.number().min(-90).max(90), // Latitude
    ]),
  }),
});

// Login validation schema
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Forgot Password validation schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format').trim().toLowerCase(),
});

// Reset Password validation schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordValidationSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Change Password validation schema
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: passwordValidationSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from the old password',
    path: ['newPassword'],
  });

// Refresh Token validation schema
export const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Profile Update validation schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim()
    .toLowerCase()
    .optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').trim().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']).optional(),
  dateOfBirth: z
    .preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    }, z.date())
    .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date of birth' })
    .refine((date) => date <= new Date(), { message: 'Date of birth cannot be in the future' })
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .trim()
    .optional(),
  country: z.string().min(1, 'Country name cannot be empty').trim().optional(),
  state: z.string().min(1, 'State name cannot be empty').trim().optional(),
  city: z.string().min(1, 'City name cannot be empty').trim().optional(),
  preferredLanguage: z.string().min(2).max(10).trim().optional(),
  timezone: z.string().min(1).trim().optional(),
});

// Sports Detail schema for sports update
export const sportDetailUpdateSchema = z.object({
  sportId: z.string().min(1, 'Sport ID is required'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  experienceLevel: z.enum(['0-1 years', '1-3 years', '3-5 years', '5+ years']),
  playingPosition: z.string().trim().optional(),
});

// Sports Update validation schema
export const sportsUpdateSchema = z.object({
  favoriteSports: z.array(z.string()).optional(),
  primarySport: z.string().optional(),
  sportsDetails: z.array(sportDetailUpdateSchema).optional(),
  preferredPlayingTime: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  fitnessInterests: z.array(z.string()).optional(),
});

// GeoJSON point update schema
export const pointUpdateSchema = z.object({
  coordinates: z.tuple([
    z.number().min(-180).max(180), // Longitude
    z.number().min(-90).max(90), // Latitude
  ]),
});

// Location Update validation schema
export const locationUpdateSchema = z.object({
  currentLocation: pointUpdateSchema.optional(),
  homeLocation: pointUpdateSchema.optional(),
  locationVisibility: z.enum(['public', 'private', 'friends']).optional(),
});

// Privacy Settings Update validation schema
export const privacyUpdateSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showLocation: z.boolean().optional(),
  showStatistics: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  showActivityHistory: z.boolean().optional(),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenValidationSchema>;

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SportDetailUpdateInput = z.infer<typeof sportDetailUpdateSchema>;
export type SportsUpdateInput = z.infer<typeof sportsUpdateSchema>;
export type PointUpdateInput = z.infer<typeof pointUpdateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type PrivacyUpdateInput = z.infer<typeof privacyUpdateSchema>;
