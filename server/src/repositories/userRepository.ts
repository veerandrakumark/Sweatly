import { User, IUser } from '../models/userModel.js';
import { BaseRepository } from './baseRepository.js';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  // Find user by email (case-insensitive lookup)
  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  // Find user by username (case-insensitive lookup)
  async findByUsername(username: string): Promise<IUser | null> {
    return this.model.findOne({ username: username.toLowerCase() }).exec();
  }

  // Find user by forgot password reset token hash and verify expiration
  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    return this.model
      .findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  // Find user by verification token hash and verify expiration
  async findByVerificationToken(tokenHash: string): Promise<IUser | null> {
    return this.model
      .findOne({
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { $gt: new Date() },
      })
      .exec();
  }

  // Geospatial search: locate athletes within a given radius in meters
  async findNearbyAthletes(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<IUser[]> {
    const { page = 1, limit = 20, sportId } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    };

    if (sportId) {
      query.preferredSports = sportId;
    }

    return this.model.find(query).skip(skip).limit(limit).exec();
  }
}
