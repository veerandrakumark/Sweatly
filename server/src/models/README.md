# Sweatly Database Module - Models and Schemas

This module holds the Mongoose model definitions, TypeScript interfaces, index mappings, and spatial query systems for Sweatly.

---

## 1. Directory Structure

```
server/src/models/
├── baseSchema.ts       # Reusable base fields (isDeleted, deletedAt) and soft-delete plug
├── userModel.ts        # User document definition & geospatial indexes
├── sportModel.ts       # Lookup sports items
├── activityModel.ts    # Fitness events & compound geo-temporal indices
├── rsvpModel.ts        # Attendance join mappings
├── commentModel.ts     # Activity forum threads
├── likeModel.ts        # Likes constraints
├── friendRequestModel.ts # Social connections
├── inviteModel.ts      # Event notifications
├── notificationModel.ts # Alerts feeds
├── sportsGroundModel.ts # Facilities profiles
├── refreshTokenModel.ts # TTL-indexed session logs
└── index.ts            # Main exporter boundary
```

---

## 2. Shared Base Fields
All collections (except lookup lists or token caches where not applicable) utilize `softDeletePlugin` which adds:
*   `isDeleted: { type: Boolean, default: false }`
*   `deletedAt: Date`

The plugin registers a pre-hook on queries (`find`, `findOne`, `findOneAndUpdate`, `countDocuments`) that filters out `isDeleted: true` records automatically.

---

## 3. Operations & Scripts

### Database Seeding
To seed sample sports lookups, mock users with geo-coordinates, and sports grounds, execute:
```bash
npx ts-node --loader ts-node/esm scripts/db-seed.ts
```
