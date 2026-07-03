import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profileService.js';
import { ValidationService } from '../services/validationService.js';
import { profileUpdateSchema, sportsUpdateSchema, privacyUpdateSchema } from 'shared';
import { AppError } from '../utils/appError.js';

export class ProfileController {
  /**
   * PATCH /users/me/profile
   * Update current user basic profile fields
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      // Validate request payload
      const validatedData = ValidationService.validate(profileUpdateSchema, req.body);

      const updatedUser = await profileService.updateProfile(req.user.userId, validatedData as any);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /users/me/sports
   * Update sports details configurations
   */
  updateSportsProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(sportsUpdateSchema, req.body);

      const updatedUser = await profileService.updateSportsProfile(
        req.user.userId,
        validatedData as any
      );

      res.status(200).json({
        success: true,
        message: 'Sports profile updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /users/me/privacy
   * Update profile privacy settings
   */
  updatePrivacySettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(privacyUpdateSchema, req.body);

      const updatedUser = await profileService.updatePrivacySettings(
        req.user.userId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const profileController = new ProfileController();
