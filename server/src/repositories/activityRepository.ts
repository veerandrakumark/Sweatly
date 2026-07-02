import { Activity, IActivity } from '../models/activityModel.js';
import { BaseRepository } from './baseRepository.js';

export class ActivityRepository extends BaseRepository<IActivity> {
  constructor() {
    super(Activity);
  }

  // Find active activities matching geospatial coordinate queries and filter options
  async findNearbyActivities(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string; status?: string } = {}
  ): Promise<IActivity[]> {
    const { page = 1, limit = 20, sportId, status = 'open' } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      status,
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
      query.sportId = sportId;
    }

    return this.model.find(query).skip(skip).limit(limit).exec();
  }
}
