import { ActivityRepository } from '../repositories/activityRepository.js';
import { statisticsService } from './statisticsService.js';
import { IActivity } from '../models/activityModel.js';
import { IGeoJSONPoint } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';
import { eventBus } from '../utils/eventBus.js';

export class ActivityService {
  private activityRepo: ActivityRepository;

  constructor(activityRepo = new ActivityRepository()) {
    this.activityRepo = activityRepo;
  }

  /**
   * Create a new sports activity
   */
  async createActivity(hostId: string, payload: any): Promise<IActivity> {
    // Structure location GeoJSON object
    const locationData: IGeoJSONPoint = {
      type: 'Point',
      coordinates: payload.location.coordinates,
    };

    const activityData = {
      ...payload,
      hostId: new Types.ObjectId(hostId),
      location: locationData,
      participants: [new Types.ObjectId(hostId)], // Host is first participant
      rsvpCount: 1,
    };

    const activity = await this.activityRepo.create(activityData);

    // Update host user profile statistics asynchronously
    await statisticsService.updateUserStats(hostId);

    // Publish event
    eventBus.publish('activity:created', { activityId: activity._id.toString(), activity });

    return activity;
  }

  /**
   * Update an existing activity
   */
  async updateActivity(activityId: string, hostId: string, payload: any): Promise<IActivity> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    // Enforce ownership
    if (activity.hostId.toString() !== hostId) {
      throw new AppError('Forbidden. You do not own this activity.', 403);
    }

    // Format location if updating coordinates
    const updateData = { ...payload };
    if (payload.location && payload.location.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: payload.location.coordinates,
      };
    }

    const updatedActivity = await this.activityRepo.update(activityId, { $set: updateData });
    if (!updatedActivity) {
      throw new AppError('Failed to update activity.', 500);
    }

    // Update statistics
    await statisticsService.updateUserStats(hostId);

    return updatedActivity;
  }

  /**
   * Soft-delete an activity
   */
  async deleteActivity(activityId: string, hostId: string): Promise<void> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    // Enforce ownership
    if (activity.hostId.toString() !== hostId) {
      throw new AppError('Forbidden. You do not own this activity.', 403);
    }

    const deleted = await this.activityRepo.delete(activityId);
    if (!deleted) {
      throw new AppError('Failed to delete activity.', 500);
    }

    // Update statistics
    await statisticsService.updateUserStats(hostId);
  }

  /**
   * Fetch activity by ID
   */
  async getActivityById(activityId: string): Promise<IActivity> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }
    return activity;
  }

  /**
   * Fetch paginated and filtered activities
   */
  async getFilteredActivities(filters: any, options: any): Promise<IActivity[]> {
    return this.activityRepo.findFilteredActivities(filters, options);
  }

  /**
   * Add a player to the activity participants list (RSVP)
   */
  async joinActivity(activityId: string, userId: string): Promise<IActivity> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    if (activity.status === 'cancelled') {
      throw new AppError('Cannot join a cancelled activity.', 400);
    }

    // Check capacity limits
    if (activity.participants.length >= activity.maxCapacity) {
      throw new AppError('This activity is already full.', 400);
    }

    const updatedActivity = await this.activityRepo.addParticipant(activityId, userId);
    if (!updatedActivity) {
      throw new AppError('Failed to join activity.', 500);
    }

    // If capacity reached, update status
    if (updatedActivity.participants.length >= updatedActivity.maxCapacity) {
      await this.activityRepo.update(activityId, { $set: { status: 'full' } });
    }

    // Recalculate stats for the joining user
    await statisticsService.updateUserStats(userId);

    return updatedActivity;
  }

  /**
   * Remove a player from the activity participants list (Cancel RSVP)
   */
  async leaveActivity(activityId: string, userId: string): Promise<IActivity> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new AppError('Activity not found.', 404);
    }

    // Host cannot leave their own activity (they should delete it instead)
    if (activity.hostId.toString() === userId) {
      throw new AppError(
        'Hosts cannot leave their own activity. Please cancel or delete the activity instead.',
        400
      );
    }

    const updatedActivity = await this.activityRepo.removeParticipant(activityId, userId);
    if (!updatedActivity) {
      throw new AppError('Failed to leave activity.', 500);
    }

    // If it was full, change status back to open
    if (
      activity.status === 'full' &&
      updatedActivity.participants.length < updatedActivity.maxCapacity
    ) {
      await this.activityRepo.update(activityId, { $set: { status: 'open' } });
    }

    // Recalculate stats for the leaving user
    await statisticsService.updateUserStats(userId);

    return updatedActivity;
  }
}

export const activityService = new ActivityService();
