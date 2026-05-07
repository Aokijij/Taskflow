import { supabase } from "../../lib/supabaseClient";
import { getAuthAvatar } from "../../utils/userHelpers";

export class AuthService {
  constructor(profileService) {
    this.profileService = profileService;
  }

  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  }

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async ensureProfile(authUser) {
    if (!authUser?.id) {
      return null;
    }

    const providerAvatar = getAuthAvatar(authUser);

    try {
      const currentProfile = await this.profileService.fetchProfile(authUser.id);

      if (providerAvatar && currentProfile?.avatarUrl !== providerAvatar) {
        return this.profileService.upsertProfile({
          ...currentProfile,
          avatarUrl: providerAvatar,
        });
      }

      return currentProfile;
    } catch (_error) {
      return this.profileService.upsertProfile({
        id: authUser.id,
        name: authUser.user_metadata?.name || "",
        lastName: authUser.user_metadata?.last_name || "",
        phone: authUser.user_metadata?.phone || "",
        avatarUrl: providerAvatar,
      });
    }
  }

  async register({ email, password, name, lastName, phone }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          last_name: lastName,
          phone,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user && data.session) {
      await this.ensureProfile(data.user);
    }

    return data;
  }

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    await this.ensureProfile(data.user);
    return data;
  }

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/task`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }
}
