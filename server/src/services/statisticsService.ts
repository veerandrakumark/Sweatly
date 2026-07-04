import { UserRepository } from '../repositories/userRepository.js';
import { ActivityRepository } from '../repositories/activityRepository.js';

export class StatisticsService {
  private userRepo: UserRepository;
  private activityRepo: ActivityRepository;

  constructor(userRepo = new UserRepository(), activityRepo = new ActivityRepository()) {
    this.userRepo = userRepo;
    this.activityRepo = activityRepo;
  }

  /**
   * Recalculates and updates the profile statistics of a user.
   * This includes total activities, unique sports played, weekly activities,
   * total distance/calories, and consecutive active day streaks.
   */
  async updateUserStats(userId: string): Promise<void> {
    // Fetch all completed or open activities hosted by the user via ActivityRepository
    const activities = await this.activityRepo.findUserActivitiesForStats(userId);

    const totalActivities = activities.length;

    // Unique sports played
    const uniqueSports = new Set<string>();
    let totalCalories = 0;
    let totalDistance = 0;

    // Filter by start times to calculate weekly activities and streaks
    const activeDates: string[] = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let weeklyActivities = 0;

    for (const activity of activities) {
      if (activity.sportId) {
        uniqueSports.add(activity.sportId.toString());
      }
      if (activity.calories) {
        totalCalories += activity.calories;
      }
      if (activity.distance) {
        totalDistance += activity.distance;
      }
      if (activity.startTime >= oneWeekAgo) {
        weeklyActivities++;
      }

      // Format date key (YYYY-MM-DD) for streak calculation
      const dateStr = activity.startTime.toISOString().split('T')[0];
      if (!activeDates.includes(dateStr)) {
        activeDates.push(dateStr);
      }
    }

    // Sort dates descending for streak calculation
    activeDates.sort((a, b) => b.localeCompare(a));

    // Calculate daily active streak
    let currentStreak = 0;
    let longestStreak = 0;

    if (activeDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Check if user has been active today or yesterday to continue current streak
      const hasRecentActivity = activeDates[0] === todayStr || activeDates[0] === yesterdayStr;

      if (hasRecentActivity) {
        currentStreak = 1;
        let lastDate = new Date(activeDates[0]);

        for (let i = 1; i < activeDates.length; i++) {
          const currentDate = new Date(activeDates[i]);
          const diffTime = Math.abs(lastDate.getTime() - currentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            currentStreak++;
            lastDate = currentDate;
          } else if (diffDays > 1) {
            // Streak broken
            break;
          }
        }
      }
    }

    // Retrieve the user to update and compare longestStreak via UserRepository
    const user = await this.userRepo.findById(userId);
    if (user) {
      // Keep track of longest streak historically
      longestStreak = Math.max(user.statistics?.longestStreak || 0, currentStreak);

      await this.userRepo.update(userId, {
        $set: {
          statistics: {
            totalActivities,
            sportsPlayedCount: uniqueSports.size,
            weeklyActivities,
            currentStreak,
            longestStreak,
            followersCount: user.statistics?.followersCount || 0,
            followingCount: user.statistics?.followingCount || 0,
            friendsCount: user.statistics?.friendsCount || 0,
          },
        },
      });
    }
  }
}

export const statisticsService = new StatisticsService();
