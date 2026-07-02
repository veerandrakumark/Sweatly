import { User, IUser } from '../models/userModel.js';
import { BaseRepository } from './baseRepository.js';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
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
