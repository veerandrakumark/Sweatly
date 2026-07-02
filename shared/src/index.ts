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

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenValidationSchema>;
