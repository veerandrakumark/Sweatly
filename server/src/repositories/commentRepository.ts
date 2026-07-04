import { Comment, IComment } from '../models/commentModel.js';
import { BaseRepository } from './baseRepository.js';
import { Types } from 'mongoose';

export class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(Comment);
  }

  /**
   * Fetch top-level comments for an activity (where parentId is null or undefined).
   * Populates commenter details.
   */
  async findActivityComments(
    activityId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<IComment[]> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    return this.model
      .find({
        activityId: new Types.ObjectId(activityId),
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
      })
      .populate('userId', 'name username avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Fetch reply comments for a specific parent comment.
   */
  async findReplies(
    commentId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<IComment[]> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    return this.model
      .find({
        parentId: new Types.ObjectId(commentId),
      })
      .populate('userId', 'name username avatarUrl')
      .sort({ createdAt: 1 }) // Show replies in chronological order
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Count the number of replies a comment has
   */
  async getRepliesCount(commentId: string): Promise<number> {
    return this.model
      .countDocuments({
        parentId: new Types.ObjectId(commentId),
        isDeleted: false,
      })
      .exec();
  }
}
