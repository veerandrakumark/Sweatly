import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { nearbySearchSchema, sportsGroundCreateSchema, sessionCreateSchema } from 'shared';
import { jwtService } from '../services/jwtService.js';
import { locationService } from '../services/locationService.js';
import { sessionService } from '../services/sessionService.js';
import { NearbyRepository } from '../repositories/nearbyRepository.js';
import { SportsGroundRepository } from '../repositories/sportsGroundRepository.js';
import { SessionRepository } from '../repositories/sessionRepository.js';

describe('Maps & Sessions Zod Validation Tests', () => {
  describe('Nearby Search Schema', () => {
    it('should validate successfully with correct parameters', () => {
      const payload = {
        longitude: '-122.4194',
        latitude: '37.7749',
        radius: '5000',
        sportId: '6688f9e16cb0b82f099c2bb1',
        skillLevel: 'intermediate',
        gender: 'female',
        ageGroup: '18-29',
        onlineStatus: 'true',
      };
      const parsed = nearbySearchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('should fail with invalid coordinates', () => {
      const payload = {
        longitude: '200',
        latitude: '37.7749',
      };
      const parsed = nearbySearchSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Sports Ground Create Schema', () => {
    it('should validate ground creation fields', () => {
      const payload = {
        name: 'Bay Area Tennis Arena',
        location: { coordinates: [-122.4194, 37.7749] },
        address: '555 Court St, San Francisco',
        supportedSports: ['6688f9e16cb0b82f099c2bb1'],
        category: 'Outdoor',
        openingHours: [{ day: 'All', open: '08:00', close: '22:00' }],
        facilities: ['Parking', 'Showers'],
      };
      const parsed = sportsGroundCreateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });

  describe('Session Create Schema', () => {
    it('should validate drop-in session creation fields', () => {
      const payload = {
        title: 'Tennis Drop-in Session',
        sportId: '6688f9e16cb0b82f099c2bb1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: { coordinates: [-122.4194, 37.7749] },
        address: '555 Court St, San Francisco',
        maxPlayers: 10,
        visibility: 'public',
      };
      const parsed = sessionCreateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });
});

describe('Geospatial & Business Service Unit Tests', () => {
  describe('Location Distance Calculation', () => {
    it('should calculate distance correctly (Haversine)', () => {
      // Distance between two points in San Francisco (approx 1.76km)
      const distance = locationService.calculateDistance(-122.4194, 37.7749, -122.4312, 37.7621);
      expect(distance).toBeGreaterThan(1700);
      expect(distance).toBeLessThan(1800);
    });

    it('should check valid GeoJSON Point structure', () => {
      expect(locationService.isValidGeoJSONPoint({ type: 'Point', coordinates: [100, 45] })).toBe(
        true
      );
      expect(locationService.isValidGeoJSONPoint({ type: 'Point', coordinates: [200, 45] })).toBe(
        false
      );
      expect(locationService.isValidGeoJSONPoint(null)).toBe(false);
    });
  });

  describe('Session RSVP & Capacity validations', () => {
    it('should throw error when joining a full session', async () => {
      const mockSession = {
        _id: 'session_id',
        status: 'active',
        maxPlayers: 2,
        currentPlayers: ['user1', 'user2'],
      } as any;

      jest.spyOn(SessionRepository.prototype, 'findById').mockResolvedValue(mockSession);

      await expect(sessionService.joinSession('session_id', 'user3')).rejects.toThrow(
        'This session has already reached maximum capacity.'
      );
    });

    it('should throw error when non-host leaves but host tries to leave', async () => {
      const mockSession = {
        _id: 'session_id',
        hostId: 'host_user_id',
        currentPlayers: ['host_user_id'],
      } as any;

      jest.spyOn(SessionRepository.prototype, 'findById').mockResolvedValue(mockSession);

      await expect(sessionService.leaveSession('session_id', 'host_user_id')).rejects.toThrow(
        'Session hosts cannot leave. Please cancel the session instead.'
      );
    });
  });
});

describe('Maps & Sessions Module REST API Integration Tests', () => {
  const mockUserId = '6688f9e16cb0b82f099c2b9a';
  const validToken = 'valid-jwt-token';

  beforeAll(() => {
    jest.spyOn(jwtService, 'verifyAccessToken').mockImplementation((token: string) => {
      if (token === validToken) {
        return { userId: mockUserId, email: 'test@example.com', role: 'User' };
      }
      throw new Error('Token verification failed');
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/nearby', () => {
    it('should list nearby players with distance mapping', async () => {
      const mockPlayers = [
        {
          _id: 'user_1',
          name: 'John Tennis',
          currentLocation: { type: 'Point', coordinates: [-122.4221, 37.7761] },
        },
      ];

      jest
        .spyOn(NearbyRepository.prototype, 'findNearbyPlayers')
        .mockResolvedValue(mockPlayers as any);

      const res = await request(app)
        .get('/api/v1/nearby?longitude=-122.4194&latitude=37.7749')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].distanceInMeters).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/grounds', () => {
    it('should create new sports ground facility', async () => {
      const payload = {
        name: 'Bay Area Tennis Arena',
        location: { coordinates: [-122.4194, 37.7749] },
        address: '555 Court St, San Francisco',
        supportedSports: ['6688f9e16cb0b82f099c2bb1'],
        category: 'Outdoor',
      };

      jest
        .spyOn(SportsGroundRepository.prototype, 'create')
        .mockResolvedValue({ _id: 'ground_id', ...payload } as any);

      const res = await request(app)
        .post('/api/v1/grounds')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Bay Area Tennis Arena');
    });
  });

  describe('POST /api/v1/sessions', () => {
    it('should schedule drop-in live session successfully', async () => {
      const payload = {
        title: 'Saturday Tennis Match',
        sportId: '6688f9e16cb0b82f099c2bb1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: { coordinates: [-122.4194, 37.7749] },
        address: '555 Court St, San Francisco',
        maxPlayers: 8,
      };

      const mockSession = {
        _id: 'session_id',
        hostId: mockUserId,
        ...payload,
        currentPlayers: [mockUserId],
        status: 'active',
      };

      jest.spyOn(SessionRepository.prototype, 'create').mockResolvedValue(mockSession as any);

      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Saturday Tennis Match');
    });
  });

  describe('POST /api/v1/sessions/:id/join', () => {
    it('should join live session', async () => {
      const mockSession = {
        _id: 'session_id',
        status: 'active',
        maxPlayers: 5,
        currentPlayers: [mockUserId],
      };

      jest.spyOn(SessionRepository.prototype, 'findById').mockResolvedValue(mockSession as any);
      jest
        .spyOn(SessionRepository.prototype, 'addPlayerToSession')
        .mockResolvedValue(mockSession as any);

      const res = await request(app)
        .post('/api/v1/sessions/session_id/join')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully joined live session.');
    });
  });
});
