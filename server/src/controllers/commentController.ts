import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/commentService.js';
import { ValidationService } from '../services/validationService.js';
import { commentCreateSchema, commentUpdateSchema } from 'shared';
import { AppError } from '../utils/appError.js';

export class CommentController {
  /**
   * POST /comments
   * Add a new comment or nested reply to an activity
   */
  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { activityId } = req.body;
      if (!activityId) {
        throw new AppError('Activity ID (activityId) is required.', 400);
      }

      const validatedData = ValidationService.validate(commentCreateSchema, req.body);
      const comment = await commentService.addComment(
        req.user.userId,
        activityId,
        validatedData.content,
        validatedData.parentId
      );

      res.status(201).json({
        success: true,
        message: 'Comment added successfully.',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /comments/:id
   * Edit comment content
   */
  editComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const validatedData = ValidationService.validate(commentUpdateSchema, req.body);
      const comment = await commentService.editComment(
        req.user.userId,
        req.params.id,
        validatedData.content
      );

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully.',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /comments/:id
   * Delete comment (soft delete)
   */
  deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      await commentService.deleteComment(req.user.userId, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/:activityId/comments
   * Retrieve top-level comments for an activity
   */
  getActivityComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const comments = await commentService.getActivityComments(req.params.activityId, {
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        count: comments.length,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /comments/:id/replies
   * Retrieve nested replies to a parent comment
   */
  getReplies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const replies = await commentService.getReplies(req.params.id, {
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        count: replies.length,
        data: replies,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const commentController = new CommentController();
