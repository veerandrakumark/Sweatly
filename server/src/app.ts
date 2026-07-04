import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { logger } from './utils/logger.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import activityRouter from './routes/activityRoutes.js';
import feedRouter from './routes/feedRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import likeRouter from './routes/likeRoutes.js';
import nearbyRouter from './routes/nearbyRoutes.js';
import groundRouter from './routes/groundRoutes.js';
import sessionRouter from './routes/sessionRoutes.js';
import presenceRouter from './routes/presenceRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';

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

// Parse JSON request bodies and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Morgan request logging middleware outputting JSON-like line outputs
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// API Version 1 - Authentication & Health Check routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/activities', activityRouter);
app.use('/api/v1/feed', feedRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/nearby', nearbyRouter);
app.use('/api/v1/grounds', groundRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/presence', presenceRouter);
app.use('/api/v1/notifications', notificationRouter);

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
