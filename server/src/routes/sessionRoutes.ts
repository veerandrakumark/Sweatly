import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { sessionController } from '../controllers/sessionController.js';

const router = Router();

// Protect all live sessions endpoints
router.use(requireAuth);

router.post('/', sessionController.create);
router.get('/nearby', sessionController.getNearbySessions);
router.get('/upcoming', sessionController.getUpcomingSessions);
router.get('/popular', sessionController.getPopularSessions);
router.get('/:id', sessionController.getById);

router.post('/:id/join', sessionController.join);
router.post('/:id/leave', sessionController.leave);
router.post('/:id/cancel', sessionController.cancel);

export default router;
