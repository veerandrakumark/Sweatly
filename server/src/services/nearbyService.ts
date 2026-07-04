import { NearbyRepository } from '../repositories/nearbyRepository.js';
import { locationService } from './locationService.js';
import { IUser } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';

export class NearbyService {
  private nearbyRepo: NearbyRepository;

  constructor(nearbyRepo = new NearbyRepository()) {
    this.nearbyRepo = nearbyRepo;
  }

  /**
   * Search for athletes near coordinates.
   * Enforces location validations and appends calculated straight-line distance.
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
  ): Promise<(IUser & { distanceInMeters: number })[]> {
    // Validate geo boundaries
    locationService.validateCoordinates([longitude, latitude]);

    if (radiusInMeters <= 0) {
      throw new AppError('Radius must be a positive number of meters.', 400);
    }

    const players = await this.nearbyRepo.findNearbyPlayers(
      longitude,
      latitude,
      radiusInMeters,
      filters,
      options
    );

    // Map players to plain objects and append calculated distance in meters
    return players.map((player) => {
      const playerObj = player.toObject ? player.toObject() : { ...player };

      let distanceInMeters = 0;
      if (player.currentLocation && player.currentLocation.coordinates) {
        const [pLon, pLat] = player.currentLocation.coordinates;
        distanceInMeters = locationService.calculateDistance(longitude, latitude, pLon, pLat);
      } else if (player.homeLocation && player.homeLocation.coordinates) {
        const [hLon, hLat] = player.homeLocation.coordinates;
        distanceInMeters = locationService.calculateDistance(longitude, latitude, hLon, hLat);
      }

      return {
        ...playerObj,
        distanceInMeters: Math.round(distanceInMeters),
      };
    });
  }
}

export const nearbyService = new NearbyService();
