import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { feedController } from '../controllers/feedController.js';

const router = Router();

// Protect community feed routes
router.use(requireAuth);

router.get('/', feedController.getCommunityFeed);

export default router;
