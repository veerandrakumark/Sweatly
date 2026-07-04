import { FeedRepository } from '../repositories/feedRepository.js';
import { IActivity } from '../models/activityModel.js';

export class FeedService {
  private feedRepo: FeedRepository;

  constructor(feedRepo = new FeedRepository()) {
    this.feedRepo = feedRepo;
  }

  /**
   * Retrieves community feed items and generates pagination cursors for infinite scrolling.
   */
  async getCommunityFeed(options: {
    cursor?: string;
    limit?: number;
    sportId?: string;
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number;
  }): Promise<{
    activities: IActivity[];
    nextCursor: string | null;
  }> {
    const limit = options.limit || 10;

    // Fetch one extra item to check if there is a next page
    const activities = await this.feedRepo.getFeed({
      ...options,
      limit: limit + 1,
    });

    let nextCursor: string | null = null;
    let slicedActivities = activities;

    if (activities.length > limit) {
      // More items exist, slice back to requested limit
      slicedActivities = activities.slice(0, limit);
      const lastItem = slicedActivities[slicedActivities.length - 1];
      nextCursor = lastItem.createdAt.toISOString();
    }

    return {
      activities: slicedActivities,
      nextCursor,
    };
  }
}

export const feedService = new FeedService();
