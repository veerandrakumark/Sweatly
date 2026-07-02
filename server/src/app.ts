import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { logger } from './utils/logger.js';

const app = express();

// Secure express app by setting various HTTP headers
app.use(helmet());

// Enable CORS with configurations
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Gzip compression middleware
app.use(compression());

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan request logging middleware outputting JSON-like line outputs
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// API Version 1 - Base Health Check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Centralized error handling middleware registrations
app.use(errorMiddleware);

export default app;
