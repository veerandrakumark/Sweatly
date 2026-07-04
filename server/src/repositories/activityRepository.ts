import { Activity, IActivity } from '../models/activityModel.js';
import { BaseRepository } from './baseRepository.js';
import { UpdateQuery, Types } from 'mongoose';

export class ActivityRepository extends BaseRepository<IActivity> {
  constructor() {
    super(Activity);
  }

  // Find active activities matching geospatial coordinate queries and filter options
  async findNearbyActivities(
    longitude: number,
    latitude: number,
    radiusInMeters: number,
    options: { page?: number; limit?: number; sportId?: string; status?: string } = {}
  ): Promise<IActivity[]> {
    const { page = 1, limit = 20, sportId, status = 'open' } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      status,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    };

    if (sportId) {
      query.sportId = sportId;
    }

    return this.model.find(query).skip(skip).limit(limit).exec();
  }

  // Retrieve activities with filters, search text, pagination, sorting
  async findFilteredActivities(
    filters: {
      sportId?: string;
      activityType?: string;
      status?: string;
      hostId?: string;
      startDate?: Date;
      endDate?: Date;
      query?: string;
      visibility?: string;
    },
    options: { page: number; limit: number; sort?: any }
  ): Promise<IActivity[]> {
    const { page = 1, limit = 20, sort = { startTime: -1 } } = options;
    const skip = (page - 1) * limit;

    const dbQuery: any = {};

    if (filters.sportId) {
      dbQuery.sportId = filters.sportId;
    }
    if (filters.activityType) {
      dbQuery.activityType = filters.activityType;
    }
    if (filters.status) {
      dbQuery.status = filters.status;
    }
    if (filters.hostId) {
      dbQuery.hostId = filters.hostId;
    }
    if (filters.visibility) {
      dbQuery.visibility = filters.visibility;
    }
    if (filters.startDate || filters.endDate) {
      dbQuery.startTime = {};
      if (filters.startDate) {
        dbQuery.startTime.$gte = filters.startDate;
      }
      if (filters.endDate) {
        dbQuery.startTime.$lte = filters.endDate;
      }
    }
    if (filters.query) {
      dbQuery.$or = [
        { title: { $regex: filters.query, $options: 'i' } },
        { description: { $regex: filters.query, $options: 'i' } },
        { address: { $regex: filters.query, $options: 'i' } },
      ];
    }

    return this.model.find(dbQuery).sort(sort).skip(skip).limit(limit).exec();
  }

  // Manage participants in an activity
  async addParticipant(activityId: string, userId: string): Promise<IActivity | null> {
    return this.model
      .findByIdAndUpdate(
        activityId,
        {
          $addToSet: { participants: new Types.ObjectId(userId) },
          $inc: { rsvpCount: 1 },
        } as UpdateQuery<IActivity>,
        { new: true }
      )
      .exec();
  }

  async removeParticipant(activityId: string, userId: string): Promise<IActivity | null> {
    return this.model
      .findByIdAndUpdate(
        activityId,
        {
          $pull: { participants: new Types.ObjectId(userId) },
          $inc: { rsvpCount: -1 },
        } as UpdateQuery<IActivity>,
        { new: true }
      )
      .exec();
  }

  // Likes Counter atomic updates
  async incrementLikesCount(activityId: string): Promise<IActivity | null> {
    return this.model
      .findByIdAndUpdate(activityId, { $inc: { likesCount: 1 } }, { new: true })
      .exec();
  }

  async decrementLikesCount(activityId: string): Promise<IActivity | null> {
    return this.model
      .findByIdAndUpdate(activityId, { $inc: { likesCount: -1 } }, { new: true })
      .exec();
  }

  // Comments Counter atomic updates
  async incrementCommentsCount(activityId: string): Promise<IActivity | null> {
    return this.model
      .findByIdAndUpdate(activityId, { $inc: { commentsCount: 1 } }, { new: true })
      .exec();
  }

  async decrementCommentsCount(activityId: string): Promise<IActivity | null> {
    return this.model
      .findByIdAndUpdate(activityId, { $inc: { commentsCount: -1 } }, { new: true })
      .exec();
  }

  // Find all active/completed activities hosted by user for stats aggregation
  async findUserActivitiesForStats(userId: string): Promise<IActivity[]> {
    return this.model
      .find({
        hostId: new Types.ObjectId(userId),
        isDeleted: false,
        status: { $ne: 'cancelled' },
      })
      .sort({ startTime: -1 })
      .exec();
  }
}
