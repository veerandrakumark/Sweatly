import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { nearbyController } from '../controllers/nearbyController.js';

const router = Router();

// Protect all nearby players endpoints
router.use(requireAuth);

router.get('/', nearbyController.findNearbyPlayers);

export default router;
