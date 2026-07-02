import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/appError.js';

// Standard rate limiter for general API routes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, _res, next) => {
    next(new AppError('Too many requests. Please try again later.', 429));
  },
});

// Strict rate limiter for sensitive authentication endpoints (Login, Register, Reset Password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window to mitigate brute-force
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('Too many authentication attempts. Please try again in 15 minutes.', 429));
  },
});
