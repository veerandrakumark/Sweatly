import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/userRepository.js';
import { IUser } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';

const userRepo = new UserRepository();

/**
 * Middleware to check profile visibility settings.
 * Attaches targetUser to the request if access is allowed.
 */
export const checkProfileVisibility = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, username } = req.params;
    const identifier = id || username;

    if (!identifier) {
      return next();
    }

    // Retrieve user by ID or Username
    let targetUser: IUser | null = null;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await userRepo.findById(identifier);
    } else {
      targetUser = await userRepo.findByUsername(identifier);
    }

    if (!targetUser) {
      throw new AppError('User not found.', 404);
    }

    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'Admin';
    const isOwner = currentUserId === targetUser._id.toString();

    // Owner and Admin can always view the profile
    if (isOwner || isAdmin) {
      req.targetUser = targetUser;
      return next();
    }

    // Access visibility settings
    const visibility = targetUser.privacySettings?.profileVisibility || 'public';

    if (visibility === 'private') {
      throw new AppError('This profile is private.', 403);
    }

    if (visibility === 'friends') {
      // Friends feature is not implemented yet, so treat as unauthorized for non-owners/admins
      throw new AppError('This profile is visible to friends only.', 403);
    }

    // Public visibility, allow access
    req.targetUser = targetUser;
    next();
  } catch (error) {
    next(error);
  }
};
