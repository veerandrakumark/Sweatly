import { ProfileRepository } from '../repositories/profileRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { imageService } from './imageService.js';
import { IUser, IPrivacySettings } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';

export class ProfileService {
  private profileRepo: ProfileRepository;
  private userRepo: UserRepository;

  constructor(profileRepo = new ProfileRepository(), userRepo = new UserRepository()) {
    this.profileRepo = profileRepo;
    this.userRepo = userRepo;
  }

  /**
   * Update basic profile fields
   */
  async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser> {
    // If username is changing, ensure it is unique
    if (data.username) {
      const existingUser = await this.userRepo.findByUsername(data.username);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new AppError('Username is already taken.', 400);
      }
    }

    const updatedUser = await this.profileRepo.updateProfile(userId, data);
    if (!updatedUser) {
      throw new AppError('Failed to update profile. User not found.', 404);
    }
    return updatedUser;
  }

  /**
   * Update sports profile settings
   */
  async updateSportsProfile(userId: string, sportsData: any): Promise<IUser> {
    const updatedUser = await this.profileRepo.updateSportsProfile(userId, sportsData);
    if (!updatedUser) {
      throw new AppError('Failed to update sports profile. User not found.', 404);
    }
    return updatedUser;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    privacyData: Partial<IPrivacySettings>
  ): Promise<IUser> {
    const updatedUser = await this.profileRepo.updatePrivacySettings(userId, privacyData);
    if (!updatedUser) {
      throw new AppError('Failed to update privacy settings. User not found.', 404);
    }
    return updatedUser;
  }

  /**
   * Upload user avatar, replacing old avatar if it exists
   */
  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<IUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Upload new avatar to storage
    const newAvatarUrl = await imageService.uploadAvatar(file);

    // Delete old avatar from storage if it exists
    if (user.avatarUrl) {
      await imageService.deleteAvatar(user.avatarUrl);
    }

    // Save avatar URL in DB
    const updatedUser = await this.profileRepo.updateAvatar(userId, newAvatarUrl);
    if (!updatedUser) {
      throw new AppError('Failed to save avatar URL.', 500);
    }

    return updatedUser;
  }

  /**
   * Delete user avatar from database and storage
   */
  async deleteAvatar(userId: string): Promise<IUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (!user.avatarUrl) {
      throw new AppError('No avatar to delete.', 400);
    }

    // Delete avatar from storage
    await imageService.deleteAvatar(user.avatarUrl);

    // Clear avatar URL in DB
    const updatedUser = await this.profileRepo.updateAvatar(userId, undefined);
    if (!updatedUser) {
      throw new AppError('Failed to clear avatar URL.', 500);
    }

    return updatedUser;
  }
}

export const profileService = new ProfileService();
