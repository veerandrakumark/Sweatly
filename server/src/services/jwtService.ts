import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface ITokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtService {
  /**
   * Generates a short-lived access token.
   */
  generateAccessToken(payload: ITokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  /**
   * Generates a long-lived refresh token.
   */
  generateRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
  }

  /**
   * Verifies an access token signature and returns the payload.
   */
  verifyAccessToken(token: string): ITokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as ITokenPayload;
  }

  /**
   * Verifies a refresh token signature and returns the payload.
   */
  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  }
}

export const jwtService = new JwtService();
