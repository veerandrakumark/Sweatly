import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireCommentAuthor } from '../middlewares/ownershipMiddleware.js';
import { commentController } from '../controllers/commentController.js';

const router = Router();

// Protect all comment routes
router.use(requireAuth);

router.post('/', commentController.addComment);
router.patch('/:id', requireCommentAuthor('id'), commentController.editComment);
router.delete('/:id', requireCommentAuthor('id'), commentController.deleteComment);

router.get('/activity/:activityId', commentController.getActivityComments);
router.get('/:id/replies', commentController.getReplies);

export default router;
