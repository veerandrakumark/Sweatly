# Sweatly Realtime & Notifications Architecture Guide

This document explains the Event-Driven WebSocket and Notifications infrastructure built for Sweatly.

---

## 1. Sequence Flow Diagrams

### WebSocket Connection & Authentication Flow
Below is the connection authentication flow during handshake:

```mermaid
sequenceDiagram
    autonumber
    Client->>SocketServer: Connect Handshake (headers/token)
    Note over SocketServer: Extract & sanitize JWT
    SocketServer->>JWTService: Verify Token Signature
    JWTService-->>SocketServer: Token Valid (decoded payload)
    SocketServer->>SocketServer: Register Socket (User mapping)
    SocketServer->>EventBus: Publish "presence:status_changed" (online)
    EventBus->>PresenceService: Handle presence event
    PresenceService->>Database: Update "onlineStatus: true" in User collection
    SocketServer-->>Client: Connection Establised (ready)
```

---

### Realtime Notification Event Cycle (e.g. Activity Liked)
Below is the cycle starting from an HTTP API request to real-time notification push:

```mermaid
sequenceDiagram
    autonumber
    ClientA->>LikeController: POST /api/v1/likes/:activityId (auth)
    LikeController->>LikeService: likeActivity(userId, activityId)
    LikeService->>LikeRepository: addLike()
    LikeService->>ActivityRepository: incrementLikesCount()
    LikeService->>EventBus: Publish "activity:liked"
    LikeService->>NotificationService: createNotification(hostId, "like", targetId)
    Note over NotificationService: Save notification details
    NotificationService->>NotificationRepository: Create Notification document
    NotificationService->>EventBus: Publish "notification:created"
    EventBus->>SocketHandlers: Listener triggered
    SocketHandlers->>SocketServer: emitToUser(hostId, "notification:received", data)
    SocketServer-->>ClientB: Push notification object via WebSocket
    LikeController-->>ClientA: 200 Success Response
```

---

## 2. Presence Tracking & Connection Mapping
- **Multiple Session support**: In-memory connection manager tracks active sessions using a `Map<string, Set<string>>` of `userId -> SocketIDs`.
- **Database Synchronization**: Presence status changes publish to the local `EventBus` to prevent tight coupling. The `PresenceService` listens to these triggers and updates the User collection's `onlineStatus` and `lastSeen` values.

## 3. OpenAPI Specifications
- **Notification API definitions**: Detailed under [swagger_notifications.yaml](file:///c:/Users/ADMIN/sweat/docs/swagger_notifications.yaml).
- **Nearby, Grounds, & Sessions API definitions**: Detailed under [swagger_maps_sessions.yaml](file:///c:/Users/ADMIN/sweat/docs/swagger_maps_sessions.yaml).
