import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`Sweatly Express Backend Server initialized successfully.`, {
        port: env.PORT,
        mode: env.NODE_ENV,
      });
    });

    // Graceful shutdown listener registration
    const shutdown = (signal: string) => {
      logger.warn(`Received signal [${signal}]. Starting graceful shutdown sequence...`);
      server.close(() => {
        logger.info('HTTP server closed successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('CRITICAL: Server startup failed during execution bootstrapping:', error);
    process.exit(1);
  }
};

startServer();
