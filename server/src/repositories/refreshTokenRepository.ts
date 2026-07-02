import { RefreshToken, IRefreshToken } from '../models/refreshTokenModel.js';
import { BaseRepository } from './baseRepository.js';

export class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshToken);
  }

  // Find refresh token record by its hashed value
  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return this.model.findOne({ tokenHash }).exec();
  }

  // Delete a specific token hash (revoke session)
  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const res = await this.model.deleteOne({ tokenHash }).exec();
    return res.deletedCount > 0;
  }

  // Revoke all active sessions for a specific user ID
  async revokeAllForUser(userId: string): Promise<void> {
    await this.model.deleteMany({ userId }).exec();
  }
}
