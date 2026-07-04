import { SportsGround, ISportsGround } from '../models/sportsGroundModel.js';
import { BaseRepository } from './baseRepository.js';

export class SportsGroundRepository extends BaseRepository<ISportsGround> {
  constructor() {
    super(SportsGround);
  }

  /**
   * Locate sports grounds within a radius.
   * Supports filtering by sport and category.
   */
  async findNearbyFacilities(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string; category?: string } = {}
  ): Promise<ISportsGround[]> {
    const { page = 1, limit = 20, sportId, category } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      isDeleted: false,
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
      query.supportedSports = sportId;
    }

    if (category) {
      query.category = category;
    }

    return this.model.find(query).skip(skip).limit(limit).exec();
  }

  /**
   * Query sports grounds with filters, search term, and sorting.
   */
  async findFilteredGrounds(
    filters: {
      category?: string;
      sportId?: string;
      query?: string;
    },
    options: { page: number; limit: number }
  ): Promise<ISportsGround[]> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const dbQuery: any = { isDeleted: false };

    if (filters.category) {
      dbQuery.category = filters.category;
    }
    if (filters.sportId) {
      dbQuery.supportedSports = filters.sportId;
    }
    if (filters.query) {
      dbQuery.$or = [
        { name: { $regex: filters.query, $options: 'i' } },
        { address: { $regex: filters.query, $options: 'i' } },
      ];
    }

    return this.model.find(dbQuery).skip(skip).limit(limit).exec();
  }
}
