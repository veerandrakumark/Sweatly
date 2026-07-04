import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { likeController } from '../controllers/likeController.js';

const router = Router();

// Protect like routes
router.use(requireAuth);

router.post('/:activityId', likeController.likeActivity);
router.delete('/:activityId', likeController.unlikeActivity);
router.get('/:activityId/status', likeController.checkUserLike);

export default router;
