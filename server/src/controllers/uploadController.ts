import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profileService.js';
import { AppError } from '../utils/appError.js';

export class UploadController {
  /**
   * POST /users/me/avatar
   * Upload / replace profile picture
   */
  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      if (!req.file) {
        throw new AppError('No image file uploaded.', 400);
      }

      const updatedUser = await profileService.uploadAvatar(req.user.userId, req.file);

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully.',
        avatarUrl: updatedUser.avatarUrl,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /users/me/avatar
   * Remove profile picture
   */
  deleteAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      await profileService.deleteAvatar(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const uploadController = new UploadController();
