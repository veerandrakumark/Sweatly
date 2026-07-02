import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB database connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB database connection error encountered:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB database connection disconnected.');
    });

    // Establish mongoose connection
    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    logger.error('CRITICAL: Failed to establish database connection during bootstrap:', error);
    throw error;
  }
};
