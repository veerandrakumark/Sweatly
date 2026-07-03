import { User, IUser, IGeoJSONPoint } from '../models/userModel.js';
import { BaseRepository } from './baseRepository.js';
import { UpdateQuery } from 'mongoose';

export class LocationRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  // Update user locations (current, home, visibility)
  async updateLocations(
    userId: string,
    data: {
      currentLocation?: IGeoJSONPoint;
      homeLocation?: IGeoJSONPoint;
      locationVisibility?: 'public' | 'private' | 'friends';
    }
  ): Promise<IUser | null> {
    const updateFields: UpdateQuery<IUser> = {};

    if (data.currentLocation !== undefined) {
      updateFields.currentLocation = data.currentLocation;
      // Keep legacy location in sync for backward compatibility
      updateFields.location = data.currentLocation;
    }
    if (data.homeLocation !== undefined) {
      updateFields.homeLocation = data.homeLocation;
    }
    if (data.locationVisibility !== undefined) {
      updateFields.locationVisibility = data.locationVisibility;
    }

    return this.update(userId, { $set: updateFields });
  }

  // Proximity athlete lookup
  async findNearby(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<IUser[] | null> {
    const { page = 1, limit = 20, sportId } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      // Filter out users who disabled location sharing in privacy
      'privacySettings.showLocation': true,
      currentLocation: {
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
      // Find matches in user's favorite sports or details
      query.$or = [
        { preferredSports: sportId },
        { 'sportsProfile.favoriteSports': sportId },
        { 'sportsProfile.sportsDetails.sportId': sportId },
      ];
    }

    return this.model.find(query).skip(skip).limit(limit).exec();
  }
}
