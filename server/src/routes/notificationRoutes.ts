import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { notificationController } from '../controllers/notificationController.js';

const router = Router();

// Protect all notification routes
router.use(requireAuth);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.delete);

export default router;
