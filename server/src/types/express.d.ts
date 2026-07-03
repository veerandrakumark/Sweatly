import { IUser } from '../models/userModel.js';

declare global {
  namespace Express {
    interface Request {
      targetUser?: IUser;
    }
  }
}

export {};
