import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { activityCreateSchema, commentCreateSchema, likeSchema } from 'shared';
import { jwtService } from '../services/jwtService.js';
import { feedService } from '../services/feedService.js';
import { ActivityRepository } from '../repositories/activityRepository.js';
import { FeedRepository } from '../repositories/feedRepository.js';
import { CommentRepository } from '../repositories/commentRepository.js';
import { LikeRepository } from '../repositories/likeRepository.js';
import { UserRepository } from '../repositories/userRepository.js';

describe('Activity & Feed Module Zod Validation Tests', () => {
  describe('Activity Create Schema', () => {
    it('should validate successfully with correct fields', () => {
      const payload = {
        title: 'Morning Yoga Session',
        sportId: '6688f9e16cb0b82f099c2bb1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location: { coordinates: [-122.4194, 37.7749] },
        address: 'Golden Gate Park, San Francisco',
        activityType: 'Yoga',
        duration: 60,
        distance: 0,
        calories: 150,
        visibility: 'public',
      };
      const parsed = activityCreateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('should fail if title is less than 5 characters', () => {
      const payload = {
        title: 'Yoga',
        sportId: '6688f9e16cb0b82f099c2bb1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location: { coordinates: [-122.4194, 37.7749] },
        address: 'Golden Gate Park',
        activityType: 'Yoga',
        duration: 60,
      };
      const parsed = activityCreateSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Comment Create Schema', () => {
    it('should validate comment body and handle parentId', () => {
      const payload = {
        content: 'This is a test comment!',
        parentId: '6688f9e16cb0b82f099c2bb2',
      };
      const parsed = commentCreateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });

  describe('Like Schema', () => {
    it('should validate like parameters', () => {
      const payload = {
        activityId: '6688f9e16cb0b82f099c2bb2',
      };
      const parsed = likeSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });
});

describe('Activity & Feed Module Service Unit Tests', () => {
  describe('Feed Service Cursor Pagination Slicing', () => {
    it('should generate nextCursor if activities exceed limit', async () => {
      const mockActivities = [
        { _id: '1', createdAt: new Date('2026-07-01T08:00:00.000Z') },
        { _id: '2', createdAt: new Date('2026-07-01T07:00:00.000Z') },
        { _id: '3', createdAt: new Date('2026-07-01T06:00:00.000Z') },
      ] as any[];

      // Mock FeedRepository
      jest.spyOn(FeedRepository.prototype, 'getFeed').mockResolvedValue(mockActivities);

      const result = await feedService.getCommunityFeed({ limit: 2 });
      expect(result.activities.length).toBe(2);
      expect(result.nextCursor).toBe(mockActivities[1].createdAt.toISOString());
    });

    it('should return nextCursor as null if limit not exceeded', async () => {
      const mockActivities = [
        { _id: '1', createdAt: new Date('2026-07-01T08:00:00.000Z') },
      ] as any[];

      jest.spyOn(FeedRepository.prototype, 'getFeed').mockResolvedValue(mockActivities);

      const result = await feedService.getCommunityFeed({ limit: 5 });
      expect(result.activities.length).toBe(1);
      expect(result.nextCursor).toBeNull();
    });
  });
});

describe('Activity & Feed Module API Integration Tests', () => {
  const mockUserId = '6688f9e16cb0b82f099c2b9a';
  const mockActivityId = '6688f9e16cb0b82f099c2bb2';
  const validToken = 'valid-activity-token';

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

  describe('POST /api/v1/activities', () => {
    it('should create activity and return details', async () => {
      const payload = {
        title: 'Morning Running Session',
        sportId: '6688f9e16cb0b82f099c2bb1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location: { coordinates: [-122.4194, 37.7749] },
        address: 'San Francisco Downtown',
        activityType: 'Running',
        duration: 30,
        distance: 5,
        calories: 300,
        visibility: 'public',
      };

      const mockCreatedActivity = {
        _id: mockActivityId,
        hostId: mockUserId,
        ...payload,
        participants: [mockUserId],
        rsvpCount: 1,
        likesCount: 0,
        commentsCount: 0,
      };

      jest
        .spyOn(ActivityRepository.prototype, 'create')
        .mockResolvedValue(mockCreatedActivity as any);
      jest
        .spyOn(UserRepository.prototype, 'findById')
        .mockResolvedValue({ _id: mockUserId } as any);
      jest.spyOn(ActivityRepository.prototype, 'findUserActivitiesForStats').mockResolvedValue([]);
      jest.spyOn(UserRepository.prototype, 'update').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Authorization', `Bearer ${validToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
    });
  });

  describe('GET /api/v1/activities/:id', () => {
    it('should retrieve activity details by ID', async () => {
      const mockActivity = {
        _id: mockActivityId,
        title: 'Morning Running Session',
        hostId: mockUserId,
        sportId: '6688f9e16cb0b82f099c2bb1',
        startTime: new Date(),
        endTime: new Date(),
        location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        address: 'San Francisco Downtown',
        activityType: 'Running',
        duration: 30,
        visibility: 'public',
        participants: [mockUserId],
        rsvpCount: 1,
      };

      jest.spyOn(ActivityRepository.prototype, 'findById').mockResolvedValue(mockActivity as any);

      const res = await request(app)
        .get(`/api/v1/activities/${mockActivityId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Morning Running Session');
    });
  });

  describe('POST /api/v1/comments', () => {
    it('should post comment on activity', async () => {
      const commentPayload = {
        activityId: mockActivityId,
        content: 'Nice workout!',
      };

      const mockComment = {
        _id: 'comment_id',
        userId: mockUserId,
        activityId: mockActivityId,
        content: 'Nice workout!',
        parentId: null,
      };

      jest
        .spyOn(ActivityRepository.prototype, 'findById')
        .mockResolvedValue({ _id: mockActivityId } as any);
      jest.spyOn(CommentRepository.prototype, 'create').mockResolvedValue(mockComment as any);
      jest
        .spyOn(ActivityRepository.prototype, 'incrementCommentsCount')
        .mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(commentPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Nice workout!');
    });
  });

  describe('POST /api/v1/likes/:activityId', () => {
    it('should like an activity', async () => {
      jest
        .spyOn(ActivityRepository.prototype, 'findById')
        .mockResolvedValue({ _id: mockActivityId } as any);
      jest.spyOn(LikeRepository.prototype, 'addLike').mockResolvedValue({} as any);
      jest.spyOn(ActivityRepository.prototype, 'incrementLikesCount').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/likes/${mockActivityId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Activity liked successfully.');
    });
  });
});
