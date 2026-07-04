import { LikeRepository } from '../repositories/likeRepository.js';
import { ActivityRepository } from '../repositories/activityRepository.js';
import { AppError } from '../utils/appError.js';

export class LikeService {
  private likeRepo: LikeRepository;
  private activityRepo: ActivityRepository;

  constructor(likeRepo = new LikeRepository(), activityRepo = new ActivityRepository()) {
    this.likeRepo = likeRepo;
    this.activityRepo = activityRepo;
  }

  /**
   * Likes an activity and increments the likes counter
   */
  async likeActivity(userId: string, activityId: string): Promise<void> {
    // Ensure activity exists
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    const like = await this.likeRepo.addLike(activityId, userId);
    if (like) {
      // Increment likes counter atomically on activity
      await this.activityRepo.incrementLikesCount(activityId);
    }
  }

  /**
   * Unlikes an activity and decrements the likes counter
   */
  async unlikeActivity(userId: string, activityId: string): Promise<void> {
    // Ensure activity exists
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    const removed = await this.likeRepo.removeLike(activityId, userId);
    if (removed) {
      // Decrement likes counter atomically on activity
      await this.activityRepo.decrementLikesCount(activityId);
    }
  }

  /**
   * Checks if user has liked an activity
   */
  async hasUserLiked(userId: string, activityId: string): Promise<boolean> {
    return this.likeRepo.hasUserLiked(activityId, userId);
  }
}

export const likeService = new LikeService();
