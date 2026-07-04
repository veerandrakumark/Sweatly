import { LiveSession, ILiveSession } from '../models/sessionModel.js';
import { BaseRepository } from './baseRepository.js';
import { Types } from 'mongoose';

export class SessionRepository extends BaseRepository<ILiveSession> {
  constructor() {
    super(LiveSession);
  }

  /**
   * Find live sessions near coordinates.
   */
  async findNearbySessions(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<ILiveSession[]> {
    const { page = 1, limit = 20, sportId } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      isDeleted: false,
      status: 'active',
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
      query.sportId = new Types.ObjectId(sportId);
    }

    return this.model.find(query).skip(skip).limit(limit).exec();
  }

  /**
   * Get upcoming sessions ordered by startTime.
   */
  async findUpcomingSessions(
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<ILiveSession[]> {
    const { page = 1, limit = 20, sportId } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      isDeleted: false,
      status: 'active',
      startTime: { $gte: new Date() },
    };

    if (sportId) {
      query.sportId = new Types.ObjectId(sportId);
    }

    return this.model.find(query).sort({ startTime: 1 }).skip(skip).limit(limit).exec();
  }

  /**
   * Get popular sessions, sorted by player occupancy.
   */
  async findPopularSessions(
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<ILiveSession[]> {
    const { page = 1, limit = 20, sportId } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      isDeleted: false,
      status: 'active',
    };

    if (sportId) {
      query.sportId = new Types.ObjectId(sportId);
    }

    // In MongoDB, we can sort by array size using $expr or aggregation.
    // For direct queries, we can sort on a calculated field or aggregate.
    // Let's use an aggregation pipeline to get accurate popular sessions.
    const pipeline: any[] = [
      { $match: query },
      { $addFields: { currentPlayersCount: { $size: '$currentPlayers' } } },
      { $sort: { currentPlayersCount: -1, startTime: 1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    return this.model.aggregate(pipeline).exec();
  }

  /**
   * Add a player to session atomically.
   */
  async addPlayerToSession(sessionId: string, userId: string): Promise<ILiveSession | null> {
    return this.model
      .findByIdAndUpdate(
        sessionId,
        { $addToSet: { currentPlayers: new Types.ObjectId(userId) } },
        { new: true }
      )
      .exec();
  }

  /**
   * Remove a player from session atomically.
   */
  async removePlayerFromSession(sessionId: string, userId: string): Promise<ILiveSession | null> {
    return this.model
      .findByIdAndUpdate(
        sessionId,
        { $pull: { currentPlayers: new Types.ObjectId(userId) } },
        { new: true }
      )
      .exec();
  }
}
