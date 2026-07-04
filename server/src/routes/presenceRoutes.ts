import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { presenceController } from '../controllers/presenceController.js';

const router = Router();

// Protect all presence endpoints
router.use(requireAuth);

router.get('/:userId', presenceController.getUserPresence);

export default router;
