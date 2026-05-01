export class ProfileService {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  async fetchProfile(userId) {
    return this.profileRepository.getById(userId);
  }

  async upsertProfile(profile) {
    return this.profileRepository.upsert(profile);
  }

  async updateProfile(userId, updates) {
    return this.profileRepository.update(userId, updates);
  }
}
