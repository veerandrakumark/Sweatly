import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/userRepository.js';
import { RefreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { passwordService } from '../services/passwordService.js';
import { jwtService } from '../services/jwtService.js';
import { tokenService } from '../services/tokenService.js';
import { emailService } from '../services/emailService.js';
import { AppError } from '../utils/appError.js';
import {
  userRegistrationSchema,
  userLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from 'shared';

const userRepo = new UserRepository();
const refreshRepo = new RefreshTokenRepository();

export class AuthController {
  /**
   * Helper to set Refresh Token Cookie
   */
  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching token lifespan
    });
  }

  /**
   * Helper to clear Refresh Token Cookie
   */
  private clearRefreshCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      path: '/auth/refresh-token',
    });
  }

  // POST /auth/register
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = userRegistrationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await userRepo.findByEmail(parsed.email);
      if (existingUser) {
        // Return generic success message to prevent account harvesting
        res.status(200).json({
          success: true,
          message: 'Registration successful. Please check your email to verify your account.',
        });
        return;
      }

      // Hash password
      const passwordHash = await passwordService.hash(parsed.password);

      // Generate verification token
      const rawVerificationToken = tokenService.generateRandomToken();
      const verificationTokenHash = tokenService.hashToken(rawVerificationToken);
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save user
      await userRepo.create({
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        preferredSports: parsed.preferredSports as any,
        location: parsed.location as any,
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false,
      });

      // Send verification email
      await emailService.sendVerificationEmail(parsed.email, rawVerificationToken);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/login
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = userLoginSchema.parse(req.body);

      const user = await userRepo.findByEmail(parsed.email);
      if (!user) {
        throw new AppError('Invalid email or password.', 401);
      }

      // Verify password
      const isMatch = await passwordService.compare(parsed.password, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Invalid email or password.', 401);
      }

      // Generate JWT Access & Refresh Tokens
      const accessToken = jwtService.generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const rawRefreshToken = jwtService.generateRefreshToken({
        userId: user._id.toString(),
      });

      // Hash refresh token for DB whitelisting
      const tokenHash = tokenService.hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await refreshRepo.create({
        userId: user._id,
        tokenHash,
        expiresAt,
      });

      // Set cookie and respond
      this.setRefreshCookie(res, rawRefreshToken);

      res.status(200).json({
        success: true,
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/logout
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.cookies || {};
      if (refreshToken) {
        const tokenHash = tokenService.hashToken(refreshToken);
        await refreshRepo.deleteByTokenHash(tokenHash);
      }

      this.clearRefreshCookie(res);

      res.status(200).json({
        success: true,
        message: 'Successfully logged out.',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/refresh-token
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.cookies || {};
      if (!refreshToken) {
        throw new AppError('Refresh token missing.', 401);
      }

      let decoded;
      try {
        decoded = jwtService.verifyRefreshToken(refreshToken);
      } catch {
        throw new AppError('Invalid or expired refresh token.', 401);
      }

      const tokenHash = tokenService.hashToken(refreshToken);
      const existingToken = await refreshRepo.findByTokenHash(tokenHash);

      if (!existingToken) {
        // Reuse detection: token has been rotated/revoked. Invalidate all user sessions.
        await refreshRepo.revokeAllForUser(decoded.userId);
        this.clearRefreshCookie(res);
        throw new AppError('Token reuse detected. All sessions revoked.', 401);
      }

      // Delete the used token record (rotation rule)
      await refreshRepo.delete(existingToken._id.toString());

      // Fetch user profile
      const user = await userRepo.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found.', 401);
      }

      // Generate new token pair
      const newAccessToken = jwtService.generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const newRawRefreshToken = jwtService.generateRefreshToken({
        userId: user._id.toString(),
      });

      // Save new refresh token hash
      const newTokenHash = tokenService.hashToken(newRawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshRepo.create({
        userId: user._id,
        tokenHash: newTokenHash,
        expiresAt,
      });

      this.setRefreshCookie(res, newRawRefreshToken);

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /auth/me
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const user = await userRepo.findById(req.user.userId);
      if (!user) {
        throw new AppError('User profile not found.', 404);
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /auth/change-password
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const parsed = changePasswordSchema.parse(req.body);

      const user = await userRepo.findById(req.user.userId);
      if (!user) {
        throw new AppError('User not found.', 404);
      }

      // Verify old password
      const isMatch = await passwordService.compare(parsed.oldPassword, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Incorrect current password.', 400);
      }

      // Hash and update new password
      const newHash = await passwordService.hash(parsed.newPassword);
      user.passwordHash = newHash;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password successfully changed.',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/forgot-password
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = forgotPasswordSchema.parse(req.body);

      const user = await userRepo.findByEmail(parsed.email);
      if (user) {
        // Generate reset token
        const rawToken = tokenService.generateRandomToken();
        const tokenHash = tokenService.hashToken(rawToken);
        const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        user.passwordResetToken = tokenHash;
        user.passwordResetExpires = expires;
        await user.save();

        await emailService.sendPasswordResetEmail(user.email, rawToken);
      }

      // Generic response for privacy
      res.status(200).json({
        success: true,
        message: 'If the email matches an active account, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/reset-password
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = resetPasswordSchema.parse(req.body);
      const tokenHash = tokenService.hashToken(parsed.token);

      const user = await userRepo.findByResetToken(tokenHash);
      if (!user) {
        throw new AppError('Invalid or expired reset token.', 400);
      }

      // Hash and set new password
      user.passwordHash = await passwordService.hash(parsed.password);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Revoke all active refresh sessions to enforce password update everywhere
      await refreshRepo.revokeAllForUser(user._id.toString());

      res.status(200).json({
        success: true,
        message: 'Password successfully reset. Please log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/verify-email
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      if (!token) {
        throw new AppError('Verification token is required.', 400);
      }

      const tokenHash = tokenService.hashToken(token);
      const user = await userRepo.findByVerificationToken(tokenHash);

      if (!user) {
        throw new AppError('Invalid or expired verification token.', 400);
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email successfully verified. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/resend-verification
  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = forgotPasswordSchema.parse(req.body);

      const user = await userRepo.findByEmail(parsed.email);
      if (user && !user.isEmailVerified) {
        const rawToken = tokenService.generateRandomToken();
        const tokenHash = tokenService.hashToken(rawToken);
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.emailVerificationToken = tokenHash;
        user.emailVerificationExpires = expires;
        await user.save();

        await emailService.sendVerificationEmail(user.email, rawToken);
      }

      res.status(200).json({
        success: true,
        message:
          'If the email matches an unverified account, a new verification link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
