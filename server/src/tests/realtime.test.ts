import { jest } from '@jest/globals';
import http from 'http';
import { AddressInfo } from 'net';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import app from '../app.js';
import { jwtService } from '../services/jwtService.js';
import { eventBus } from '../utils/eventBus.js';
import { socketServer } from '../socket/socketServer.js';
import { socketHandlers } from '../socket/socketHandlers.js';
import { UserRepository } from '../repositories/userRepository.js';
import { NotificationRepository } from '../repositories/notificationRepository.js';
import { presenceService } from '../services/presenceService.js';

describe('Realtime Event Bus & Presence Unit Tests', () => {
  it('should publish and subscribe to events on the EventBus', (done) => {
    const testData = { userId: '123', status: 'online' };

    const listener = (payload: any) => {
      expect(payload.data).toEqual(testData);
      expect(payload.event).toBe('presence:status_changed');
      eventBus.unsubscribe('presence:status_changed', listener);
      done();
    };

    eventBus.subscribe('presence:status_changed', listener);
    eventBus.publish('presence:status_changed', testData);
  });

  it('should update presence status in database', async () => {
    const mockUpdate = jest.spyOn(UserRepository.prototype, 'update').mockResolvedValue({} as any);
    const mockFind = jest.spyOn(UserRepository.prototype, 'findById').mockResolvedValue({
      _id: 'user_123',
      onlineStatus: true,
      lastSeen: new Date(),
    } as any);

    presenceService.initListener();

    // Trigger status changed to online
    eventBus.publish('presence:status_changed', { userId: 'user_123', status: 'online' });

    // Allow async handlers to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockUpdate).toHaveBeenCalledWith('user_123', {
      $set: {
        onlineStatus: true,
        lastSeen: undefined,
      },
    });

    const status = await presenceService.getUserPresence('user_123');
    expect(status?.onlineStatus).toBe(true);

    mockUpdate.mockRestore();
    mockFind.mockRestore();
  });
});

describe('WebSocket Server Handshake & Realtime Broadcast Integration Tests', () => {
  let httpServer: http.Server;
  let clientSocket: ClientSocket;
  let port: number;
  const mockUserId = '6688f9e16cb0b82f099c2b9a';
  let token: string;

  beforeAll((done) => {
    httpServer = http.createServer();
    socketServer.init(httpServer);
    socketHandlers.init();

    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      token = jwtService.generateAccessToken({
        userId: mockUserId,
        email: 'test@example.com',
        role: 'User',
      });
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    socketServer.close();
    httpServer.close(done);
  });

  it('should reject connection when no token is supplied', (done) => {
    const badClient = ioc(`http://localhost:${port}`, {
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });

    badClient.on('connect_error', (err) => {
      expect(err.message).toBe('Authentication failed: No token provided');
      badClient.disconnect();
      done();
    });
  });

  it('should authenticate client successfully with valid JWT token', (done) => {
    clientSocket = ioc(`http://localhost:${port}`, {
      query: { token },
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it('should receive realtime events through session rooms join/emissions', (done) => {
    clientSocket.emit('join_room', 'session:abc');

    // Setup client listener
    clientSocket.on('session:joined', (data) => {
      expect(data.userId).toBe('user_xyz');
      done();
    });

    // Simulate database join publishing to eventBus
    setTimeout(() => {
      eventBus.publish('session:joined', { sessionId: 'abc', userId: 'user_xyz' });
    }, 50);
  });
});

describe('Notification API Endpoint Integration Tests', () => {
  const mockUserId = '6688f9e16cb0b82f099c2b9a';
  const mockNotificationId = '6688f9e16cb0b82f099c2b9b';
  let validToken: string;

  beforeAll(() => {
    validToken = jwtService.generateAccessToken({
      userId: mockUserId,
      email: 'test@example.com',
      role: 'User',
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should retrieve list of user notifications', async () => {
      const mockNotifications = [
        {
          _id: mockNotificationId,
          userId: mockUserId,
          type: 'like',
          title: 'Activity Liked',
          message: 'An athlete liked your activity.',
          isRead: false,
          isDeleted: false,
        },
      ];

      jest
        .spyOn(NotificationRepository.prototype, 'getNotificationsByUser')
        .mockResolvedValue(mockNotifications as any);

      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toBe('Activity Liked');
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread count', async () => {
      jest.spyOn(NotificationRepository.prototype, 'getUnreadCount').mockResolvedValue(5);

      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(5);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = {
        _id: mockNotificationId,
        userId: mockUserId,
        isRead: true,
      };

      jest
        .spyOn(NotificationRepository.prototype, 'markAsRead')
        .mockResolvedValue(mockNotification as any);

      const res = await request(app)
        .patch(`/api/v1/notifications/${mockNotificationId}/read`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should soft delete a notification', async () => {
      const mockNotification = {
        _id: mockNotificationId,
        userId: mockUserId,
        isDeleted: true,
      };

      jest
        .spyOn(NotificationRepository.prototype, 'deleteNotification')
        .mockResolvedValue(mockNotification as any);

      const res = await request(app)
        .delete(`/api/v1/notifications/${mockNotificationId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification deleted successfully.');
    });
  });
});
