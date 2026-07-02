import { SportsGround, ISportsGround } from '../models/sportsGroundModel.js';
import { BaseRepository } from './baseRepository.js';

export class SportsGroundRepository extends BaseRepository<ISportsGround> {
  constructor() {
    super(SportsGround);
  }

  // Find facilities within radius
  async findNearbyFacilities(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    sportId?: string
  ): Promise<ISportsGround[]> {
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
      query.supportedSports = sportId;
    }

    return this.model.find(query).exec();
  }
}
