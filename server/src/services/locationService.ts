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
   * Validate if coordinates coordinates are within geographical limits [-180, 180] and [-90, 90]
   */
  validateCoordinates(coords: [number, number]): void {
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

  /**
   * Calculate distance between two coordinates in meters using the Haversine formula.
   */
  calculateDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  /**
   * Check if a structure is a valid Point GeoJSON object
   */
  isValidGeoJSONPoint(location: any): boolean {
    if (!location || typeof location !== 'object') return false;
    if (location.type !== 'Point') return false;
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) return false;
    const [lon, lat] = location.coordinates;
    return (
      typeof lon === 'number' &&
      typeof lat === 'number' &&
      lon >= -180 &&
      lon <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }
}

export const locationService = new LocationService();
