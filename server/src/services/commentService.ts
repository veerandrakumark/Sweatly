import { CommentRepository } from '../repositories/commentRepository.js';
import { ActivityRepository } from '../repositories/activityRepository.js';
import { IComment } from '../models/commentModel.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';

export class CommentService {
  private commentRepo: CommentRepository;
  private activityRepo: ActivityRepository;

  constructor(commentRepo = new CommentRepository(), activityRepo = new ActivityRepository()) {
    this.commentRepo = commentRepo;
    this.activityRepo = activityRepo;
  }

  /**
   * Add a comment or reply to an activity
   */
  async addComment(
    userId: string,
    activityId: string,
    content: string,
    parentId?: string | null
  ): Promise<IComment> {
    // Ensure activity exists
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    const commentData: any = {
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
      content,
    };

    // If it's a nested reply, validate the parent comment
    if (parentId) {
      const parentComment = await this.commentRepo.findById(parentId);
      if (!parentComment) {
        throw new AppError('Parent comment not found.', 404);
      }
      if (parentComment.activityId.toString() !== activityId) {
        throw new AppError('Parent comment does not belong to this activity.', 400);
      }
      commentData.parentId = new Types.ObjectId(parentId);
    }

    const comment = await this.commentRepo.create(commentData);

    // Increment activity comments count counter
    await this.activityRepo.incrementCommentsCount(activityId);

    return comment;
  }

  /**
   * Edit comment content
   */
  async editComment(userId: string, commentId: string, content: string): Promise<IComment> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found.', 404);
    }

    // Verify ownership
    if (comment.userId.toString() !== userId) {
      throw new AppError('Forbidden. You do not own this comment.', 403);
    }

    const updatedComment = await this.commentRepo.update(commentId, { $set: { content } });
    if (!updatedComment) {
      throw new AppError('Failed to update comment.', 500);
    }

    return updatedComment;
  }

  /**
   * Soft delete a comment and decrement counts
   */
  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found.', 404);
    }

    // Verify ownership
    if (comment.userId.toString() !== userId) {
      throw new AppError('Forbidden. You do not own this comment.', 403);
    }

    const deleted = await this.commentRepo.delete(commentId);
    if (!deleted) {
      throw new AppError('Failed to delete comment.', 500);
    }

    // Decrement comments counter
    await this.activityRepo.decrementCommentsCount(comment.activityId.toString());
  }

  /**
   * Fetch top-level comments for an activity
   */
  async getActivityComments(activityId: string, options: any): Promise<IComment[]> {
    return this.commentRepo.findActivityComments(activityId, options);
  }

  /**
   * Fetch replies for a comment
   */
  async getReplies(commentId: string, options: any): Promise<IComment[]> {
    return this.commentRepo.findReplies(commentId, options);
  }
}

export const commentService = new CommentService();
