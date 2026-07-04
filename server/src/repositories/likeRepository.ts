import { Like, ILike } from '../models/likeModel.js';
import { BaseRepository } from './baseRepository.js';
import { Types } from 'mongoose';

export class LikeRepository extends BaseRepository<ILike> {
  constructor() {
    super(Like);
  }

  /**
   * Register a user's like on an activity.
   * Leverages the compound unique index to prevent duplicate entries.
   */
  async addLike(activityId: string, userId: string): Promise<ILike | null> {
    try {
      return await this.model.create({
        activityId: new Types.ObjectId(activityId),
        userId: new Types.ObjectId(userId),
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // Already liked, ignore duplicate
        return null;
      }
      throw err;
    }
  }

  /**
   * Remove a user's like from an activity.
   */
  async removeLike(activityId: string, userId: string): Promise<boolean> {
    const result = await this.model
      .deleteOne({
        activityId: new Types.ObjectId(activityId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return result.deletedCount > 0;
  }

  /**
   * Check if a user has liked an activity.
   */
  async hasUserLiked(activityId: string, userId: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({
        activityId: new Types.ObjectId(activityId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return count > 0;
  }

  /**
   * Count total likes for an activity.
   */
  async getLikesCount(activityId: string): Promise<number> {
    return this.model
      .countDocuments({
        activityId: new Types.ObjectId(activityId),
      })
      .exec();
  }
}
