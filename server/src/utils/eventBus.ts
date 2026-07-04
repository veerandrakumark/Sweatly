import { EventEmitter } from 'events';

export type EventType =
  // Live Session events
  | 'session:created'
  | 'session:updated'
  | 'session:cancelled'
  | 'session:joined'
  | 'session:left'
  | 'session:full'
  // Activity Feed events
  | 'activity:created'
  | 'activity:updated'
  | 'activity:liked'
  | 'activity:unliked'
  | 'activity:commented'
  | 'activity:replied'
  // Notification system events
  | 'notification:created'
  // Presence online/offline status change events
  | 'presence:status_changed';

export interface EventPayload {
  event: EventType;
  timestamp: Date;
  data: any;
}

export class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Set max listeners to prevent warnings in heavy load environments
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publish a strongly-typed event with custom data payload
   */
  publish(event: EventType, data: any): void {
    const payload: EventPayload = {
      event,
      timestamp: new Date(),
      data,
    };
    this.emitter.emit(event, payload);
  }

  /**
   * Subscribe to a strongly-typed event
   */
  subscribe(event: EventType, listener: (payload: EventPayload) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * Unsubscribe a listener from an event
   */
  unsubscribe(event: EventType, listener: (payload: EventPayload) => void): void {
    this.emitter.off(event, listener);
  }
}

export const eventBus = new EventBus();
