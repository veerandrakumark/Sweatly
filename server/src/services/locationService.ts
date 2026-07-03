import { LocationRepository } from '../repositories/locationRepository.js';
import { IUser } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';

export class LocationService {
  private locationRepo: LocationRepository;

  constructor(locationRepo = new LocationRepository()) {
    this.locationRepo = locationRepo;
  }

  /**
   * Update user location configurations
   */
  async updateLocations(
    userId: string,
    data: {
      currentLocation?: { coordinates: [number, number] };
      homeLocation?: { coordinates: [number, number] };
      locationVisibility?: 'public' | 'private' | 'friends';
    }
  ): Promise<IUser> {
    const formattedData: any = { ...data };

    // Basic validations and format mapping
    if (data.currentLocation) {
      this.validateCoordinates(data.currentLocation.coordinates);
      formattedData.currentLocation = {
        type: 'Point',
        coordinates: data.currentLocation.coordinates,
      };
    }
    if (data.homeLocation) {
      this.validateCoordinates(data.homeLocation.coordinates);
      formattedData.homeLocation = {
        type: 'Point',
        coordinates: data.homeLocation.coordinates,
      };
    }

    const updatedUser = await this.locationRepo.updateLocations(userId, formattedData);
    if (!updatedUser) {
      throw new AppError('Failed to update locations. User not found.', 404);
    }
    return updatedUser;
  }

  /**
   * Proximity athletes lookup
   */
  async findNearbyAthletes(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<IUser[]> {
    this.validateCoordinates([longitude, latitude]);

    if (radiusInMeters <= 0) {
      throw new AppError('Radius must be a positive number of meters.', 400);
    }

    const players = await this.locationRepo.findNearby(
      longitude,
      latitude,
      radiusInMeters,
      options
    );
    return players || [];
  }

  /**
   * Coordinate bounds check
   */
  private validateCoordinates(coords: [number, number]): void {
    if (!coords || coords.length !== 2) {
      throw new AppError(
        'Invalid coordinates. Location coordinates must be [longitude, latitude].',
        400
      );
    }
    const [lon, lat] = coords;
    if (lon < -180 || lon > 180) {
      throw new AppError('Longitude must be between -180 and 180 degrees.', 400);
    }
    if (lat < -90 || lat > 90) {
      throw new AppError('Latitude must be between -90 and 90 degrees.', 400);
    }
  }
}

export const locationService = new LocationService();
