# MongoDB Aggregation Pipelines Planning - Sweatly

This document defines standard MongoDB aggregation pipelines designed for high-performance retrieval of complex data matrices.

---

## 1. Activity Feed Pipeline (with RSVP counts, likes, and host details)

This pipeline retrieves activities sorted by proximity, joins host profiles and sport details, calculates confirmation counts, and checks if the active user has liked/joined the event.

```javascript
[
  // Stage 1: Geospatial Proximity Match
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distance',
      maxDistance: radiusMeters,
      query: { isDeleted: false, status: 'open' },
      spherical: true,
    },
  },
  // Stage 2: Join Host Details
  {
    $lookup: {
      from: 'users',
      localField: 'hostId',
      foreignField: '_id',
      as: 'host',
    },
  },
  { $unwind: '$host' },
  // Stage 3: Join Sport Lookup Details
  {
    $lookup: {
      from: 'sports',
      localField: 'sportId',
      foreignField: '_id',
      as: 'sport',
    },
  },
  { $unwind: '$sport' },
  // Stage 4: Lookup RSVPs
  {
    $lookup: {
      from: 'rsvps',
      let: { activityId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [{ $eq: ['$activityId', '$$activityId'] }, { $eq: ['$status', 'confirmed'] }],
            },
          },
        },
        { $project: { userId: 1 } },
      ],
      as: 'confirmedRSVPs',
    },
  },
  // Stage 5: Lookup Likes
  {
    $lookup: {
      from: 'likes',
      localField: '_id',
      foreignField: 'activityId',
      as: 'likes',
    },
  },
  // Stage 6: Project Final Feed DTO
  {
    $project: {
      title: 1,
      description: 1,
      startTime: 1,
      endTime: 1,
      address: 1,
      maxCapacity: 1,
      distance: 1,
      host: { _id: 1, name: 1, avatarUrl: 1 },
      sport: { name: 1, slug: 1 },
      attendeeCount: { $size: '$confirmedRSVPs' },
      likeCount: { $size: '$likes' },
      hasUserLiked: { $in: [currentUserId, '$likes.userId'] },
      hasUserJoined: { $in: [currentUserId, '$confirmedRSVPs.userId'] },
    },
  },
  // Stage 7: Paginate
  { $skip: skipAmount },
  { $limit: limitAmount },
];
```

---

## 2. User Profile Stats Pipeline

Calculates an athlete's metrics, including total workouts logged, activities hosted, and sports preference mappings.

```javascript
[
  { $match: { _id: userId, isDeleted: false } },
  // Lookup hosted activities
  {
    $lookup: {
      from: 'activities',
      localField: '_id',
      foreignField: 'hostId',
      as: 'hostedActivities',
    },
  },
  // Lookup confirmed RSVPs
  {
    $lookup: {
      from: 'rsvps',
      let: { userId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$status', 'confirmed'] }] },
          },
        },
      ],
      as: 'confirmedEvents',
    },
  },
  // Project Metrics DTO
  {
    $project: {
      name: 1,
      avatarUrl: 1,
      skillLevel: 1,
      createdAt: 1,
      stats: {
        hostedCount: { $size: '$hostedActivities' },
        joinedCount: { $size: '$confirmedEvents' },
      },
    },
  },
];
```

---

## 3. Nearby Players Pipeline (with Blurred Geolocation Coordinates)

Exposes nearby athletes matching compatible sports interests and skill levels, while enforcing location coordinate randomizations (as per privacy ADR-05).

```javascript
[
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distance',
      maxDistance: radiusMeters,
      query: { isDeleted: false, _id: { $ne: currentUserId } },
      spherical: true,
    },
  },
  // Filter by matching preferred sports
  { $match: { preferredSports: sportId } },
  // Project Profile DTO with offset location coordinates
  {
    $project: {
      name: 1,
      avatarUrl: 1,
      skillLevel: 1,
      distance: 1,
      // Randomize coordinates offset by ~200 meters using mathematical noise
      blurredLocation: {
        type: 'Point',
        coordinates: [
          {
            $add: [
              { $arrayElemAt: ['$location.coordinates', 0] },
              { $subtract: [{ $rand: {} }, 0.5] },
            ],
          }, // offset lng
          {
            $add: [
              { $arrayElemAt: ['$location.coordinates', 1] },
              { $subtract: [{ $rand: {} }, 0.5] },
            ],
          }, // offset lat
        ],
      },
    },
  },
];
```
