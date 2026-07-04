import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

// Setup multer memory storage
const storage = multer.memoryStorage();

// Accept max 5MB files of type JPEG, PNG, or WebP
export const uploadAvatarMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new AppError('Invalid image type. Only JPEG, PNG, and WebP are allowed.', 400));
      return;
    }
    cb(null, true);
  },
}).single('avatar');

// Accept multiple media files (max 5 photos, max 5MB each)
export const uploadActivityMediaMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400));
      return;
    }
    cb(null, true);
  },
}).array('media', 5);

/**
 * Middleware wrapper to capture and format Multer errors nicely
 */
export const handleUploadErrors = (
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size exceeds the 5MB limit.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Too many files uploaded. Maximum is 5.', 400));
    }
    return next(new AppError(`File upload error: ${err.message}`, 400));
  }
  next(err);
};
