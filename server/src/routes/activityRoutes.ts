import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireActivityHost } from '../middlewares/ownershipMiddleware.js';
import {
  uploadActivityMediaMiddleware,
  handleUploadErrors,
} from '../middlewares/fileValidationMiddleware.js';
import { activityController } from '../controllers/activityController.js';

const router = Router();

// Protect all routes
router.use(requireAuth);

router.post('/', activityController.create);
router.get('/', activityController.list);
router.get('/:id', activityController.getById);

// Host ownership required to update or delete
router.patch('/:id', requireActivityHost('id'), activityController.update);
router.delete('/:id', requireActivityHost('id'), activityController.delete);

// Participants join/leave
router.post('/:id/join', activityController.join);
router.post('/:id/leave', activityController.leave);

// Media uploads
router.post(
  '/media',
  uploadActivityMediaMiddleware,
  handleUploadErrors,
  activityController.uploadMedia
);

export default router;
