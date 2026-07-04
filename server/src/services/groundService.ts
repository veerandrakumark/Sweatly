import { SportsGroundRepository } from '../repositories/sportsGroundRepository.js';
import { locationService } from './locationService.js';
import { ISportsGround } from '../models/sportsGroundModel.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';

export class GroundService {
  private groundRepo: SportsGroundRepository;

  constructor(groundRepo = new SportsGroundRepository()) {
    this.groundRepo = groundRepo;
  }

  /**
   * Register a new sports ground facility
   */
  async createGround(payload: any): Promise<ISportsGround> {
    const formattedLocation = {
      type: 'Point',
      coordinates: payload.location.coordinates,
    };

    const groundData = {
      ...payload,
      location: formattedLocation,
      supportedSports: payload.supportedSports.map((id: string) => new Types.ObjectId(id)),
    };

    return this.groundRepo.create(groundData);
  }

  /**
   * Fetch sports ground by ID
   */
  async getGroundById(id: string): Promise<ISportsGround> {
    const ground = await this.groundRepo.findById(id);
    if (!ground) {
      throw new AppError('Sports ground not found.', 404);
    }
    return ground;
  }

  /**
   * Retrieve facilities within proximity, calculating straight-line distances
   */
  async getNearbyGrounds(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string; category?: string } = {}
  ): Promise<(ISportsGround & { distanceInMeters: number })[]> {
    locationService.validateCoordinates([longitude, latitude]);

    if (radiusInMeters <= 0) {
      throw new AppError('Radius must be a positive number of meters.', 400);
    }

    const grounds = await this.groundRepo.findNearbyFacilities(
      longitude,
      latitude,
      radiusInMeters,
      options
    );

    return grounds.map((ground) => {
      const groundObj = ground.toObject ? ground.toObject() : { ...ground };
      const [gLon, gLat] = ground.location.coordinates;
      const distanceInMeters = locationService.calculateDistance(longitude, latitude, gLon, gLat);

      return {
        ...groundObj,
        distanceInMeters: Math.round(distanceInMeters),
      };
    });
  }

  /**
   * Paginated search lookup
   */
  async searchGrounds(filters: any, options: any): Promise<ISportsGround[]> {
    return this.groundRepo.findFilteredGrounds(filters, options);
  }
}

export const groundService = new GroundService();
