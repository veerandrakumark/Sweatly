import { User, IUser } from '../models/userModel.js';
import { Types } from 'mongoose';

export class NearbyRepository {
  private readonly model = User;

  /**
   * Search for nearby athletes using GeoJSON geospatial filters.
   * Supports filtering by sport, skill level, gender, age group, availability, and online status.
   */
  async findNearbyPlayers(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    filters: {
      sportId?: string;
      skillLevel?: string;
      gender?: string;
      ageGroup?: string;
      availability?: string;
      onlineStatus?: boolean;
    },
    options: { page?: number; limit?: number } = {}
  ): Promise<IUser[]> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const dbQuery: any = {
      isDeleted: false,
      // Target only users who have location visibility enabled or set to friends/public
      // By default if the user opted out of location sharing, we exclude them.
      'privacySettings.showLocation': { $ne: false },
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

    // Sport matching filter
    if (filters.sportId) {
      const sportOid = new Types.ObjectId(filters.sportId);

      // Filter by skillLevel if specified alongside the sport
      if (filters.skillLevel) {
        dbQuery.sportsDetails = {
          $elemMatch: {
            sportId: sportOid,
            skillLevel: filters.skillLevel,
          },
        };
      } else {
        dbQuery.preferredSports = sportOid;
      }
    }

    // Gender filter
    if (filters.gender) {
      dbQuery.gender = filters.gender;
    }

    // Age Group mapping to DOB date bounds
    if (filters.ageGroup) {
      const now = new Date();
      const under18Limit = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      const age30Limit = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());
      const age50Limit = new Date(now.getFullYear() - 50, now.getMonth(), now.getDate());

      if (filters.ageGroup === 'under-18') {
        dbQuery.dateOfBirth = { $gt: under18Limit };
      } else if (filters.ageGroup === '18-29') {
        dbQuery.dateOfBirth = { $lte: under18Limit, $gt: age30Limit };
      } else if (filters.ageGroup === '30-49') {
        dbQuery.dateOfBirth = { $lte: age30Limit, $gt: age50Limit };
      } else if (filters.ageGroup === '50-plus') {
        dbQuery.dateOfBirth = { $lte: age50Limit };
      }
    }

    // Availability filter
    if (filters.availability) {
      dbQuery.availability = filters.availability;
    }

    // Online status filter
    if (filters.onlineStatus !== undefined) {
      dbQuery.onlineStatus = filters.onlineStatus;
    }

    return this.model.find(dbQuery).skip(skip).limit(limit).exec();
  }
}
