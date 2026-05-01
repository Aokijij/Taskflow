import { serviceFactory } from "../core/factory/serviceFactory";

const profileService = serviceFactory.createProfileService();

export const fetchProfile = (userId) => profileService.fetchProfile(userId);
export const upsertProfile = (profile) => profileService.upsertProfile(profile);
export const updateProfile = (userId, updates) =>
  profileService.updateProfile(userId, updates);
