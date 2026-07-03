import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/appError.js';

// Storage Provider contract to support multiple storage backends (Local, AWS S3, Cloudinary, etc.)
export interface IStorageProvider {
  upload(file: Express.Multer.File): Promise<string>;
  delete(fileUrl: string): Promise<void>;
}

// Development and local testing storage provider writing files to disk
export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve('public/uploads/avatars');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);
    // Return relative public path
    return `/uploads/avatars/${fileName}`;
  }

  async delete(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.startsWith('/uploads/avatars/')) {
      return;
    }
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err: any) {
      // Log deletion error but do not block operations
      console.error(`Failed to delete local file: ${filePath}`, err);
    }
  }
}

export class ImageService {
  private storageProvider: IStorageProvider;
  private readonly maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(storageProvider: IStorageProvider = new LocalStorageProvider()) {
    this.storageProvider = storageProvider;
  }

  /**
   * Validate image properties before upload
   */
  validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new AppError('No file provided for upload', 400);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type [${file.mimetype}]. Only JPEG, PNG, and WebP are allowed.`,
        400
      );
    }

    if (file.size > this.maxSizeBytes) {
      throw new AppError('File size exceeds the 5MB limit', 400);
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    this.validateImage(file);
    return this.storageProvider.upload(file);
  }

  /**
   * Delete user avatar from storage
   */
  async deleteAvatar(fileUrl: string): Promise<void> {
    await this.storageProvider.delete(fileUrl);
  }
}

export const imageService = new ImageService();
