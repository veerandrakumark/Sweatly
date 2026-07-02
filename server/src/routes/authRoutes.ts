import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

// Public auth endpoints with strict brute-force rate-limiting
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/resend-verification', authRateLimiter, authController.resendVerification);

// Token resolution endpoints
router.post('/refresh-token', authController.refreshToken);
router.post('/verify-email', authController.verifyEmail);
router.post('/logout', authController.logout);

// Protected auth endpoints (requires a valid JWT access token)
router.get('/me', requireAuth, authController.me);
router.patch('/change-password', requireAuth, authController.changePassword);

export default router;
