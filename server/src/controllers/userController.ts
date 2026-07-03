import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { AppError } from '../utils/appError.js';

export class UserController {
  /**
   * GET /users/me
   * Retrieve current user profile
   */
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }
      const user = await userService.getUserById(req.user.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users/:id
   * Retrieve user profile by ID (after privacy check middleware)
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Use cached user from profileVisibilityMiddleware if available, otherwise fetch
      const user = req.targetUser || (await userService.getUserById(req.params.id));

      // Filter sensitive details for public/other users (e.g. passwordHash, email verification tokens)
      const sanitizedUser = this.sanitizeUserProfile(user);

      res.status(200).json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users/username/:username
   * Retrieve user profile by Username (after privacy check middleware)
   */
  getUserByUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.targetUser || (await userService.getUserByUsername(req.params.username));
      const sanitizedUser = this.sanitizeUserProfile(user);

      res.status(200).json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper to sanitize public user profile representation
   */
  private sanitizeUserProfile(user: any) {
    const userObj = user.toObject ? user.toObject() : { ...user };

    // Remove authentication-sensitive details
    delete userObj.passwordHash;
    delete userObj.emailVerificationToken;
    delete userObj.emailVerificationExpires;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;

    // Apply conditional privacy filters based on user's privacy settings
    const showStats = userObj.privacySettings?.showStatistics !== false;
    const showLocation = userObj.privacySettings?.showLocation !== false;

    if (!showStats) {
      delete userObj.statistics;
    }
    if (!showLocation) {
      delete userObj.location;
      delete userObj.currentLocation;
      delete userObj.homeLocation;
    }
    // Note: Activity history itself is managed by the Activities module,
    // but the flag can be read from here by clients.

    return userObj;
  }
}

export const userController = new UserController();
