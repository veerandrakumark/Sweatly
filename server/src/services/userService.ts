import { UserRepository } from '../repositories/userRepository.js';
import { IUser } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';

export class UserService {
  private userRepo: UserRepository;

  constructor(userRepo = new UserRepository()) {
    this.userRepo = userRepo;
  }

  /**
   * Fetch user by MongoDB ID
   */
  async getUserById(id: string): Promise<IUser> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  /**
   * Fetch user by Username
   */
  async getUserByUsername(username: string): Promise<IUser> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new AppError(`User with username '${username}' not found.`, 404);
    }
    return user;
  }
}

export const userService = new UserService();
