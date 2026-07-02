# Database Design Specification - Sweatly
**Project Name:** Sweatly  
**Author:** Senior Staff Software Engineer  
**Status:** Pending Approval  

This document details the database architecture, schema definitions, relational layout, and indexing strategy for the **Sweatly** platform.

---

## 1. Entities & Purpose (MVP Scope)

| Entity | Why It Exists | What Problem It Solves | Scalability Path |
| :--- | :--- | :--- | :--- |
| **Users** | Holds athlete profile details and preferences. | Identifies active players, skill levels, and locations. | Sharded by user location regions. |
| **Sports** | Standard list of supported sports (e.g. Tennis, Soccer). | Avoids spelling errors in profiles/searches. | Cached in Redis to prevent DB queries. |
| **Activities** | Represents scheduled local fitness events. | Coordinates local matches and attendee RSVPs. | Compound indexed on `startTime` and `location`. |
| **Comments** | Event group chat/forum threads. | Facilitates game coordination discussions. | Pagination using bucket-pattern. |
| **Likes** | Tracks user engagements on posts/logs. | Social reinforcement and gamification feedback. | Embedded counts on activities; referenced details. |
| **Friend Requests**| Models social connections between users. | Restricts invitations to established connections. | Stored as separate request docs for audit. |
| **Invites** | Direct invitation from organizers to players. | Proactively recruits players for sports activities. | Expiry TTL index for auto-deletion of old records. |
| **Notifications** | Alerts users of invites, chat updates, or RSVPs. | Drives engagement when users are offline. | TTL index deletes notifications after 30 days. |
| **Sports Grounds** | Profiles of local facilities (parks, gyms). | Identifies play locations on a map. | Geolocation indexes for fast facility search. |
| **Refresh Tokens** | Tracks active auth sessions. | Revokes security access tokens without database hits. | Stored in Redis or as single TTL-indexed collection. |

---

## 2. MongoDB Collection Schemas

All collections incorporate the **Common Base Schema** fields:
*   `createdAt` (Date, default `Date.now`)
*   `updatedAt` (Date, default `Date.now`)
*   `isDeleted` (Boolean, default `false`)
*   `deletedAt` (Date, optional)

### 2.1 Users Collection
*   `name` (String, required): Min 2 characters.
*   `email` (String, required, unique): Matches email regex pattern.
*   `passwordHash` (String, required): Secure bcrypt hash.
*   `role` (String, enum: `['User', 'Admin']`, default `'User'`).
*   `preferredSports` (Array of ObjectId referencing Sports, required).
*   `skillLevel` (String, enum: `['beginner', 'intermediate', 'advanced']`, default `'beginner'`).
*   `location` (Object, required): GeoJSON Point.
    *   `type` (String, default `'Point'`).
    *   `coordinates` (Array of Numbers: `[longitude, latitude]`).
*   `avatarUrl` (String, optional).
*   *Soft Delete Strategy:* When a user deletes their account, `isDeleted` is set to `true`, personal data is scrubbed, and the unique email has `_deleted_<timestamp>` appended to free it up for re-registration.

### 2.2 Sports Collection
*   `name` (String, required, unique): E.g., `'Tennis'`, `'Soccer'`.
*   `slug` (String, required, unique): E.g., `'tennis'`, `'soccer'`.
*   `iconUrl` (String, optional).
*   *Soft Delete Strategy:* Not applicable (static core lookup data).

### 2.3 Activities Collection
*   `hostId` (ObjectId referencing Users, required).
*   `title` (String, required): Min 5, max 100 characters.
*   `sportId` (ObjectId referencing Sports, required).
*   `description` (String, optional).
*   `startTime` (Date, required).
*   `endTime` (Date, required): Must be after `startTime`.
*   `location` (Object, required): GeoJSON Point.
    *   `type` (String, default `'Point'`).
    *   `coordinates` (Array of Numbers: `[longitude, latitude]`).
*   `address` (String, required).
*   `maxCapacity` (Number, default `10`): Max 100 players.
*   `status` (String, enum: `['open', 'full', 'cancelled', 'completed']`, default `'open'`).
*   `rsvpCount` (Number, default `1`).
*   *Soft Delete Strategy:* Sets `isDeleted` to `true` and marks the `status` as `'cancelled'`.

### 2.4 Comments Collection
*   `activityId` (ObjectId referencing Activities, required).
*   `userId` (ObjectId referencing Users, required).
*   `content` (String, required): Max 500 characters.
*   *Soft Delete Strategy:* Sets `isDeleted` to `true` and returns "This message has been deleted".

### 2.5 Likes Collection
*   `activityId` (ObjectId referencing Activities, required).
*   `userId` (ObjectId referencing Users, required).
*   *Soft Delete Strategy:* Hard delete upon user toggling the like button off.

### 2.6 Friend Requests Collection
*   `senderId` (ObjectId referencing Users, required).
*   `receiverId` (ObjectId referencing Users, required).
*   `status` (String, enum: `['pending', 'accepted', 'declined']`, default `'pending'`).
*   *Soft Delete Strategy:* Hard delete if the request is declined or cancelled.

### 2.7 Invites Collection
*   `activityId` (ObjectId referencing Activities, required).
*   `senderId` (ObjectId referencing Users, required).
*   `receiverId` (ObjectId referencing Users, required).
*   `status` (String, enum: `['pending', 'accepted', 'declined']`, default `'pending'`).
*   *Soft Delete Strategy:* Soft deleted when the activity date passes using a TTL index.

### 2.8 Notifications Collection
*   `userId` (ObjectId referencing Users, required).
*   `type` (String, enum: `['invite', 'rsvp', 'comment', 'system']`, required).
*   `title` (String, required).
*   `message` (String, required).
*   `isRead` (Boolean, default `false`).
*   `targetId` (ObjectId, optional): References the target resource (e.g. ActivityId).
*   *Soft Delete Strategy:* TTL index deletes notifications after 30 days.

### 2.9 Sports Grounds Collection
*   `name` (String, required).
*   `location` (Object, required): GeoJSON Point.
    *   `type` (String, default `'Point'`).
    *   `coordinates` (Array of Numbers: `[longitude, latitude]`).
*   `address` (String, required).
*   `supportedSports` (Array of ObjectId referencing Sports).
*   *Soft Delete Strategy:* Standard `isDeleted` toggle.

### 2.10 Refresh Tokens Collection
*   `userId` (ObjectId referencing Users, required).
*   `tokenHash` (String, required, unique): SHA-256 hash.
*   `expiresAt` (Date, required): Mapped to a TTL index for automatic session expiration.
*   *Soft Delete Strategy:* Hard delete when session is explicitly logged out.

---

## 3. Relationships

### 3.1 One-to-One Relationships
*   **User to Refresh Token:** One active token record per session. Implemented using **Referenced Documents** to prevent bloated user documents and allow quick session revocation.

### 3.2 One-to-Many Relationships
*   **Activity to Comments:** One activity has many comments. Implemented using **Referenced Documents** because comments can grow indefinitely, and embedding them in the activity document would hit MongoDB's 16MB document size limit.
*   **User to Notifications:** One user has many notifications. Implemented using **Referenced Documents** with a TTL index to ensure list lookups remain fast.

### 3.3 Many-to-Many Relationships
*   **Users to Sports (Preferences):** Users select multiple preferred sports, and sports have multiple users. Implemented using **Referenced Documents** (an array of Sports ObjectIds in the User schema) because the Sports collection is small and static, which simplifies updates.
*   **Activities to Attendees (RSVPs):** Implemented using a separate **RSVP Collection** instead of embedding an array of user IDs inside the Activity document. This prevents document bloat and allows querying a user's RSVP history independently.

---

## 4. Indexing Strategy

*   **Authentication & Session Management:**
    *   `users`: Unique index on `email: 1`
    *   `refreshTokens`: Single field index on `tokenHash: 1`
*   **Geospatial & Proximity Searches:**
    *   `users`: Geospatial index on `location: "2dsphere"`
    *   `sportsGrounds`: Geospatial index on `location: "2dsphere"`
*   **Activity Feed Queries:**
    *   `activities`: Compound index on `location: "2dsphere"`, `startTime: 1`, `sportId: 1`
*   **Social & Engagements:**
    *   `friendRequests`: Compound index on `senderId: 1`, `receiverId: 1`
    *   `likes`: Compound index on `activityId: 1`, `userId: 1` (forces single likes)
*   **Notification Feeds:**
    *   `notifications`: Compound index on `userId: 1`, `isRead: 1`, `createdAt: -1`

---

## 5. Geo-Spatial Design

### Storage Protocol
All spatial coordinates are stored in the standard **GeoJSON Point** format:
```json
{
  "location": {
    "type": "Point",
    "coordinates": [-74.0060, 40.7128]
  }
}
```
*Note:* The coordinates array must store values in `[longitude, latitude]` order to run queries correctly.

### Geospatial Indexing
We define a `2dsphere` index on the location fields:
```javascript
schema.index({ location: '2dsphere' });
```

### Proximity Queries
To query nearby sports activities or athletes, we use MongoDB's `$near` operator:
```javascript
const maxDistanceMeters = radiusMiles * 1609.34;
const query = {
  location: {
    $near: {
      $geometry: {
        type: "Point",
        "coordinates": [longitude, latitude]
      },
      $maxDistance: maxDistanceMeters
    }
  }
};
```
MongoDB's `2dsphere` index calculates distances on an oblate spheroid, making it highly accurate for location-based services.
