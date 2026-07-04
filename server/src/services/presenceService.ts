import { eventBus } from '../utils/eventBus.js';
import { UserRepository } from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

export class PresenceService {
  private userRepo: UserRepository;

  constructor(userRepo = new UserRepository()) {
    this.userRepo = userRepo;
  }

  /**
   * Listen to status changes on the event bus and persist them to MongoDB
   */
  initListener(): void {
    eventBus.subscribe('presence:status_changed', async (payload) => {
      try {
        const { userId, status } = payload.data;
        const isOnline = status === 'online';

        await this.userRepo.update(userId, {
          $set: {
            onlineStatus: isOnline,
            lastSeen: isOnline ? undefined : new Date(), // Set lastSeen when going offline
          },
        });

        logger.info(`Database presence status updated for user: ${userId} to ${status}`);
      } catch (error: any) {
        logger.error(`Error handling presence status change event: ${error.message}`);
      }
    });
  }

  /**
   * Retrieve online presence status and last seen timestamp of a user
   */
  async getUserPresence(userId: string): Promise<{ onlineStatus: boolean; lastSeen: Date } | null> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return null;
    }
    return {
      onlineStatus: user.onlineStatus || false,
      lastSeen: user.lastSeen || user.updatedAt,
    };
  }
}

export const presenceService = new PresenceService();
