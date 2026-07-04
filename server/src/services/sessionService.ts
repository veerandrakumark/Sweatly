import { SessionRepository } from '../repositories/sessionRepository.js';
import { SportsGroundRepository } from '../repositories/sportsGroundRepository.js';
import { locationService } from './locationService.js';
import { ILiveSession } from '../models/sessionModel.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';

export class SessionService {
  private sessionRepo: SessionRepository;
  private groundRepo: SportsGroundRepository;

  constructor(sessionRepo = new SessionRepository(), groundRepo = new SportsGroundRepository()) {
    this.sessionRepo = sessionRepo;
    this.groundRepo = groundRepo;
  }

  /**
   * Schedule a new Live drop-in Sports Session.
   */
  async createSession(hostId: string, payload: any): Promise<ILiveSession> {
    // Validate coordinates
    locationService.validateCoordinates(payload.location.coordinates);

    // If sportsGroundId is supplied, check facility exists
    if (payload.sportsGroundId) {
      const groundExists = await this.groundRepo.findById(payload.sportsGroundId);
      if (!groundExists) {
        throw new AppError('Specified sports ground facility does not exist.', 404);
      }
    }

    const sessionData = {
      ...payload,
      hostId: new Types.ObjectId(hostId),
      sportsGroundId: payload.sportsGroundId ? new Types.ObjectId(payload.sportsGroundId) : null,
      sportId: new Types.ObjectId(payload.sportId),
      location: {
        type: 'Point',
        coordinates: payload.location.coordinates,
      },
      currentPlayers: [new Types.ObjectId(hostId)], // Host is first player
    };

    return this.sessionRepo.create(sessionData);
  }

  /**
   * Fetch session details by ID.
   */
  async getSessionById(sessionId: string): Promise<ILiveSession> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404);
    }
    return session;
  }

  /**
   * Join an active session (respects capacity constraints).
   */
  async joinSession(sessionId: string, userId: string): Promise<ILiveSession> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404);
    }

    if (session.status !== 'active') {
      throw new AppError(`Cannot join a session that is ${session.status}.`, 400);
    }

    // Check capacity limits
    if (session.currentPlayers.length >= session.maxPlayers) {
      throw new AppError('This session has already reached maximum capacity.', 400);
    }

    const updatedSession = await this.sessionRepo.addPlayerToSession(sessionId, userId);
    if (!updatedSession) {
      throw new AppError('Failed to join live session.', 500);
    }

    return updatedSession;
  }

  /**
   * Leave a session.
   */
  async leaveSession(sessionId: string, userId: string): Promise<ILiveSession> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404);
    }

    // Host cannot leave (they should cancel instead)
    if (session.hostId.toString() === userId) {
      throw new AppError('Session hosts cannot leave. Please cancel the session instead.', 400);
    }

    const updatedSession = await this.sessionRepo.removePlayerFromSession(sessionId, userId);
    if (!updatedSession) {
      throw new AppError('Failed to leave live session.', 500);
    }

    return updatedSession;
  }

  /**
   * Cancel a session (requires host authority).
   */
  async cancelSession(sessionId: string, hostId: string): Promise<ILiveSession> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404);
    }

    if (session.hostId.toString() !== hostId) {
      throw new AppError('Forbidden. Only the host can cancel this session.', 403);
    }

    const updatedSession = await this.sessionRepo.update(sessionId, {
      $set: { status: 'cancelled' },
    });
    if (!updatedSession) {
      throw new AppError('Failed to cancel session.', 500);
    }

    return updatedSession;
  }

  /**
   * Retrieve nearby live sessions
   */
  async getNearbySessions(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string } = {}
  ): Promise<(ILiveSession & { distanceInMeters: number })[]> {
    locationService.validateCoordinates([longitude, latitude]);

    if (radiusInMeters <= 0) {
      throw new AppError('Radius must be a positive number of meters.', 400);
    }

    const sessions = await this.sessionRepo.findNearbySessions(
      longitude,
      latitude,
      radiusInMeters,
      options
    );

    return sessions.map((session) => {
      const sessionObj = session.toObject ? session.toObject() : { ...session };
      const [sLon, sLat] = session.location.coordinates;
      const distanceInMeters = locationService.calculateDistance(longitude, latitude, sLon, sLat);

      return {
        ...sessionObj,
        distanceInMeters: Math.round(distanceInMeters),
      };
    });
  }

  /**
   * Retrieve upcoming sessions
   */
  async getUpcomingSessions(options: any): Promise<ILiveSession[]> {
    return this.sessionRepo.findUpcomingSessions(options);
  }

  /**
   * Retrieve popular sessions
   */
  async getPopularSessions(options: any): Promise<ILiveSession[]> {
    return this.sessionRepo.findPopularSessions(options);
  }
}

export const sessionService = new SessionService();
