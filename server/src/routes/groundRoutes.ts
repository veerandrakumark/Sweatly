import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { groundController } from '../controllers/groundController.js';

const router = Router();

// Protect all grounds endpoints
router.use(requireAuth);

router.post('/', groundController.create);
router.get('/nearby', groundController.getNearbyGrounds);
router.get('/:id', groundController.getById);
router.get('/', groundController.search);

export default router;
