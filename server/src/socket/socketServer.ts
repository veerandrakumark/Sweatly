import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { jwtService } from '../services/jwtService.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../utils/eventBus.js';

export class SocketServer {
  private io!: SocketIOServer;

  // Maps userId -> Set of Socket IDs (handling multiple tabs/devices)
  private userSockets = new Map<string, Set<string>>();

  // Reverse lookup: socketId -> userId
  private socketToUser = new Map<string, string>();

  /**
   * Close the Socket.io server connection pool
   */
  close(): void {
    if (this.io) {
      this.io.close();
    }
  }

  /**
   * Initialize Socket.io server bound to HTTP server instance
   */
  init(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Customize in production as needed
        methods: ['GET', 'POST'],
      },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    // Auth Handshake Middleware
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          logger.warn(
            `Socket connection rejected: No handshake token provided. Socket ID: ${socket.id}`
          );
          return next(new Error('Authentication failed: No token provided'));
        }

        // Clean bearer prefix if present
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwtService.verifyAccessToken(cleanToken);

        // Attach user info to socket
        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;

        next();
      } catch (error: any) {
        logger.warn(
          `Socket connection rejected: Invalid handshake token. Socket ID: ${socket.id}. Error: ${error.message}`
        );
        return next(new Error('Authentication failed: Invalid token'));
      }
    });

    // Connection Handler
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      this.registerConnection(userId, socket.id);

      logger.info(`WebSocket client connected. User ID: ${userId}, Socket ID: ${socket.id}`);

      // Handle custom Room actions
      socket.on('join_room', (room: string) => {
        socket.join(room);
        logger.info(`Socket ${socket.id} joined room: ${room}`);
      });

      socket.on('leave_room', (room: string) => {
        socket.leave(room);
        logger.info(`Socket ${socket.id} left room: ${room}`);
      });

      // Handle Disconnections
      socket.on('disconnect', (reason) => {
        this.deregisterConnection(userId, socket.id);
        logger.info(
          `WebSocket client disconnected. User ID: ${userId}, Socket ID: ${socket.id}. Reason: ${reason}`
        );
      });
    });

    return this.io;
  }

  /**
   * Track online socket associations in-memory
   */
  private registerConnection(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
      // Trigger user-online event via EventBus for presence tracking
      eventBus.publish('presence:status_changed', { userId, status: 'online' });
    }

    this.userSockets.get(userId)!.add(socketId);
    this.socketToUser.set(socketId, userId);
  }

  /**
   * Clean up offline socket associations
   */
  private deregisterConnection(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        // Trigger user-offline event via EventBus for presence tracking
        eventBus.publish('presence:status_changed', { userId, status: 'offline' });
      }
    }
    this.socketToUser.delete(socketId);
  }

  /**
   * Emit event directly to all socket instances of a single user
   */
  emitToUser(userId: string, event: string, data: any): void {
    const sockets = this.userSockets.get(userId);
    if (sockets && this.io) {
      for (const socketId of sockets) {
        this.io.to(socketId).emit(event, data);
      }
    }
  }

  /**
   * Emit event to a room
   */
  emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

export const socketServer = new SocketServer();
