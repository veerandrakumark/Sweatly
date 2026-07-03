import { User, IUser, IPrivacySettings } from '../models/userModel.js';
import { BaseRepository } from './baseRepository.js';
import { UpdateQuery, Types } from 'mongoose';

export class ProfileRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  // Update basic profile fields
  async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    const updateFields: UpdateQuery<IUser> = {};
    const allowedKeys = [
      'name',
      'username',
      'bio',
      'gender',
      'dateOfBirth',
      'phoneNumber',
      'country',
      'state',
      'city',
      'preferredLanguage',
      'timezone',
    ];

    for (const key of allowedKeys) {
      if ((data as any)[key] !== undefined) {
        updateFields[key as keyof IUser] = (data as any)[key];
      }
    }

    return this.update(userId, { $set: updateFields });
  }

  // Update sports profile details
  async updateSportsProfile(userId: string, sportsData: any): Promise<IUser | null> {
    const updateFields: UpdateQuery<IUser> = {};

    if (sportsData.favoriteSports !== undefined) {
      updateFields['sportsProfile.favoriteSports'] = sportsData.favoriteSports.map(
        (id: string) => new Types.ObjectId(id)
      );
    }
    if (sportsData.primarySport !== undefined) {
      updateFields['sportsProfile.primarySport'] = new Types.ObjectId(sportsData.primarySport);
    }
    if (sportsData.sportsDetails !== undefined) {
      updateFields['sportsProfile.sportsDetails'] = sportsData.sportsDetails.map((detail: any) => ({
        sportId: new Types.ObjectId(detail.sportId),
        skillLevel: detail.skillLevel,
        experienceLevel: detail.experienceLevel,
        playingPosition: detail.playingPosition,
      }));
    }
    if (sportsData.preferredPlayingTime !== undefined) {
      updateFields['sportsProfile.preferredPlayingTime'] = sportsData.preferredPlayingTime;
    }
    if (sportsData.availability !== undefined) {
      updateFields['sportsProfile.availability'] = sportsData.availability;
    }
    if (sportsData.fitnessInterests !== undefined) {
      updateFields['sportsProfile.fitnessInterests'] = sportsData.fitnessInterests;
    }

    return this.update(userId, { $set: updateFields });
  }

  // Update privacy settings
  async updatePrivacySettings(
    userId: string,
    privacyData: Partial<IPrivacySettings>
  ): Promise<IUser | null> {
    const updateFields: UpdateQuery<IUser> = {};

    if (privacyData.profileVisibility !== undefined) {
      updateFields['privacySettings.profileVisibility'] = privacyData.profileVisibility;
    }
    if (privacyData.showLocation !== undefined) {
      updateFields['privacySettings.showLocation'] = privacyData.showLocation;
    }
    if (privacyData.showStatistics !== undefined) {
      updateFields['privacySettings.showStatistics'] = privacyData.showStatistics;
    }
    if (privacyData.showOnlineStatus !== undefined) {
      updateFields['privacySettings.showOnlineStatus'] = privacyData.showOnlineStatus;
    }
    if (privacyData.showActivityHistory !== undefined) {
      updateFields['privacySettings.showActivityHistory'] = privacyData.showActivityHistory;
    }

    return this.update(userId, { $set: updateFields });
  }

  // Update profile avatar image
  async updateAvatar(userId: string, avatarUrl: string | undefined): Promise<IUser | null> {
    return this.update(userId, { $set: { avatarUrl } });
  }
}
