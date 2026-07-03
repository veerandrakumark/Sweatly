import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { checkProfileVisibility } from '../middlewares/profileVisibilityMiddleware.js';
import {
  uploadAvatarMiddleware,
  handleUploadErrors,
} from '../middlewares/fileValidationMiddleware.js';
import { userController } from '../controllers/userController.js';
import { profileController } from '../controllers/profileController.js';
import { locationController } from '../controllers/locationController.js';
import { uploadController } from '../controllers/uploadController.js';

const router = Router();

// Protect all user module routes with authentication
router.use(requireAuth);

// Base GET endpoints
router.get('/me', userController.getMe);
router.get('/nearby', locationController.findNearbyAthletes);
router.get('/:id', checkProfileVisibility, userController.getUserById);
router.get('/username/:username', checkProfileVisibility, userController.getUserByUsername);

// Profile patch endpoints
router.patch('/me/profile', profileController.updateProfile);
router.patch('/me/sports', profileController.updateSportsProfile);
router.patch('/me/privacy', profileController.updatePrivacySettings);
router.patch('/me/locations', locationController.updateLocation);

// Avatar upload and delete endpoints
router.post(
  '/me/avatar',
  uploadAvatarMiddleware,
  handleUploadErrors,
  uploadController.uploadAvatar
);
router.delete('/me/avatar', uploadController.deleteAvatar);

export default router;
