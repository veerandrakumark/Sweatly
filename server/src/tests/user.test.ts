import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import {
  profileUpdateSchema,
  sportsUpdateSchema,
  locationUpdateSchema,
  privacyUpdateSchema,
} from 'shared';
import { jwtService } from '../services/jwtService.js';
import { imageService } from '../services/imageService.js';
import { locationService } from '../services/locationService.js';
import { UserRepository } from '../repositories/userRepository.js';
import { ProfileRepository } from '../repositories/profileRepository.js';

describe('User Module Validation Tests (Zod)', () => {
  describe('Profile Update Schema', () => {
    it('should pass with valid profile properties', () => {
      const payload = {
        name: 'Sarah Connor',
        username: 'sarah_connor1',
        bio: 'Saving the future.',
        gender: 'female',
        dateOfBirth: '1985-05-12T00:00:00.000Z',
        phoneNumber: '+14155551234',
        country: 'United States',
        state: 'California',
        city: 'Los Angeles',
        preferredLanguage: 'en',
        timezone: 'PST',
      };
      const parsed = profileUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('should fail when username contains invalid characters', () => {
      const payload = { username: 'sarah-connor!' };
      const parsed = profileUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it('should fail when date of birth is in the future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const payload = { dateOfBirth: futureDate };
      const parsed = profileUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it('should fail when phone number is invalid', () => {
      const payload = { phoneNumber: 'not-a-phone-number' };
      const parsed = profileUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Sports Update Schema', () => {
    it('should pass with valid sports settings', () => {
      const payload = {
        favoriteSports: ['6688f9e16cb0b82f099c2bb1'],
        primarySport: '6688f9e16cb0b82f099c2bb1',
        sportsDetails: [
          {
            sportId: '6688f9e16cb0b82f099c2bb1',
            skillLevel: 'intermediate',
            experienceLevel: '1-3 years',
            playingPosition: 'Midfielder',
          },
        ],
        preferredPlayingTime: ['evening'],
        availability: ['weekend_mornings'],
        fitnessInterests: ['running'],
      };
      const parsed = sportsUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });

  describe('Location & Privacy Updates', () => {
    it('should pass valid location parameters', () => {
      const payload = {
        currentLocation: { coordinates: [-122.4194, 37.7749] },
        homeLocation: { coordinates: [-122.4312, 37.7621] },
        locationVisibility: 'friends',
      };
      const parsed = locationUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('should fail invalid coordinates in location', () => {
      const payload = {
        currentLocation: { coordinates: [200, 45] },
      };
      const parsed = locationUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it('should pass valid privacy changes', () => {
      const payload = {
        profileVisibility: 'friends',
        showLocation: false,
        showStatistics: true,
      };
      const parsed = privacyUpdateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });
});

describe('User Module Service Unit Tests', () => {
  describe('Image Service Validation', () => {
    it('should throw AppError for unsupported MIME formats', () => {
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'file.gif',
        encoding: '7bit',
        mimetype: 'image/gif',
        size: 1000,
        buffer: Buffer.from([]),
      } as Express.Multer.File;

      expect(() => imageService.validateImage(mockFile)).toThrow('Invalid file type');
    });

    it('should throw AppError for sizes exceeding 5MB limit', () => {
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'file.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 6 * 1024 * 1024, // 6MB
        buffer: Buffer.from([]),
      } as Express.Multer.File;

      expect(() => imageService.validateImage(mockFile)).toThrow('File size exceeds the 5MB limit');
    });
  });

  describe('Location Service Coordinates Bounds', () => {
    it('should throw error for out-of-bounds coordinates', async () => {
      await expect(
        locationService.updateLocations('userId', {
          currentLocation: { coordinates: [190, 45] }, // 190 longitude is invalid
        })
      ).rejects.toThrow('Longitude must be between -180 and 180 degrees.');
    });
  });
});

describe('User Module REST API Integration Tests', () => {
  const mockUserId = '6688f9e16cb0b82f099c2b9a';
  const validToken = 'valid-jwt-token';

  // Inject token decoder stub
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

  describe('GET /api/v1/users/me', () => {
    it('should block requests lacking Authorization headers', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return profile information for authenticated user', async () => {
      const mockUser = {
        _id: mockUserId,
        name: 'Sarah Athlete',
        email: 'test@example.com',
        username: 'sarah_athlete',
        role: 'User',
      } as any;

      // Mock repository call using spyOn
      jest.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('sarah_athlete');
    });
  });

  describe('PATCH /api/v1/users/me/profile', () => {
    it('should update profile fields successfully', async () => {
      const updatePayload = {
        name: 'Sarah New Name',
        bio: 'Updated active athlete.',
      };

      const mockUpdatedUser = {
        _id: mockUserId,
        name: 'Sarah New Name',
        bio: 'Updated active athlete.',
      } as any;

      jest.spyOn(UserRepository.prototype, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(ProfileRepository.prototype, 'updateProfile').mockResolvedValue(mockUpdatedUser);

      const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sarah New Name');
    });

    it('should fail profile update for invalid request parameters', async () => {
      const invalidPayload = {
        username: 'ab', // too short
      };

      const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id profile privacy rules', () => {
    it('should block non-owner requests to private profiles', async () => {
      const targetUserId = '6688f9e16cb0b82f099c2b9b'; // different user
      const mockTargetUser = {
        _id: targetUserId,
        name: 'Private Athlete',
        privacySettings: {
          profileVisibility: 'private',
        },
      } as any;

      jest.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(mockTargetUser);

      const res = await request(app)
        .get(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('This profile is private');
    });
  });
});
