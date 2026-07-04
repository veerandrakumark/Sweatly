import { Activity, IActivity } from '../models/activityModel.js';
import { Types } from 'mongoose';

export class FeedRepository {
  private readonly model = Activity;

  /**
   * Retrieves the community activity feed with cursor-based pagination.
   * Matches activities that are public.
   * Supports filtering by sport, nearby location, and cursor boundaries.
   */
  async getFeed(options: {
    cursor?: string; // Expects an ISO string or Date representing the createdAt cutoff
    limit?: number;
    sportId?: string;
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number;
  }): Promise<IActivity[]> {
    const { cursor, limit = 10, sportId, longitude, latitude, radiusInMeters } = options;

    const query: any = {
      visibility: 'public',
      isDeleted: false,
    };

    // Filter by sport if provided
    if (sportId) {
      query.sportId = new Types.ObjectId(sportId);
    }

    // Apply cursor pagination constraint
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    // Apply location constraint if coordinates are provided
    if (longitude !== undefined && latitude !== undefined && radiusInMeters !== undefined) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      };

      // If we use $near, MongoDB sorts by distance by default.
      // To keep cursor pagination clean, we can perform a $geoWithin search instead,
      // which allows sorting by createdAt descending! Let's use $geoWithin if we want strict time sorting,
      // or keep $near. Actually, $near is excellent for proximity feeds, and we can sort by distance.
      // Let's implement $geoWithin with $centerSphere if we want to combine custom sorting (e.g. by time)
      // with proximity constraints.
      // Proximity feed using $geoWithin allows custom sorting by createdAt:
      // Earth's radius in meters is 6,378,100
      const radians = radiusInMeters / 6378100;
      query.location = {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radians],
        },
      };
    }

    // Sort by most recent first and apply limit
    return this.model.find(query).sort({ createdAt: -1 }).limit(limit).exec();
  }
}
