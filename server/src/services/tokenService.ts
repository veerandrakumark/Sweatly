import crypto from 'crypto';

export class TokenService {
  /**
   * Generates a SHA-256 hash of a token string.
   * Prevents database leak compromises of raw token values.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically secure random token (e.g., for email verification or password resets).
   */
  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const tokenService = new TokenService();
