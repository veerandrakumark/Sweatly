import { eventBus, EventPayload } from '../utils/eventBus.js';
import { socketServer } from './socketServer.js';
import { logger } from '../utils/logger.js';

export class SocketHandlers {
  /**
   * Bind event bus subscriptions to WebSocket emissions
   */
  init(): void {
    // 1. Realtime Notifications delivery to specific online users
    eventBus.subscribe('notification:created', (payload: EventPayload) => {
      try {
        const notification = payload.data;
        const targetUserId = notification.userId.toString();

        socketServer.emitToUser(targetUserId, 'notification:received', notification);
        logger.info(`Realtime notification pushed to user: ${targetUserId}`);
      } catch (error: any) {
        logger.error(`Error processing socket emission for notification: ${error.message}`);
      }
    });

    // 2. Live Session Events
    const sessionEvents: Array<
      | 'session:created'
      | 'session:updated'
      | 'session:cancelled'
      | 'session:joined'
      | 'session:left'
      | 'session:full'
    > = [
      'session:created',
      'session:updated',
      'session:cancelled',
      'session:joined',
      'session:left',
      'session:full',
    ];

    sessionEvents.forEach((event) => {
      eventBus.subscribe(event, (payload: EventPayload) => {
        try {
          const { sessionId } = payload.data;
          const room = `session:${sessionId}`;

          // Broadcast the event to the session room
          socketServer.emitToRoom(room, event, payload.data);
          logger.info(`WebSocket broadcast event [${event}] to room [${room}]`);
        } catch (error: any) {
          logger.error(`Error broadcasting session event [${event}]: ${error.message}`);
        }
      });
    });

    // 3. Activity Feed Realtime Events
    const activityEvents: Array<
      | 'activity:created'
      | 'activity:updated'
      | 'activity:liked'
      | 'activity:unliked'
      | 'activity:commented'
      | 'activity:replied'
    > = [
      'activity:created',
      'activity:updated',
      'activity:liked',
      'activity:unliked',
      'activity:commented',
      'activity:replied',
    ];

    activityEvents.forEach((event) => {
      eventBus.subscribe(event, (payload: EventPayload) => {
        try {
          // Broadcast general activity updates to a global feed channel
          // In a scalable environment, this could target friend groups or region channels.
          socketServer.emitToRoom('activity_feed', event, payload.data);
          logger.info(`WebSocket broadcast activity feed event [${event}]`);
        } catch (error: any) {
          logger.error(`Error broadcasting activity feed event [${event}]: ${error.message}`);
        }
      });
    });
  }
}

export const socketHandlers = new SocketHandlers();
