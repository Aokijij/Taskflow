import { supabase } from "../../lib/supabaseClient";

const mapProfileRecord = (record) => {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    lastName: record.last_name,
    phone: record.phone,
    avatarUrl: record.avatar_url,
    browserNotificationsEnabled: Boolean(record.browser_notifications_enabled),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
};

export class SupabaseProfileRepository {
  async getById(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return mapProfileRecord(data);
  }

  async upsert(profile) {
    const payload = {
      id: profile.id,
      name: profile.name,
      last_name: profile.lastName,
      phone: profile.phone,
      avatar_url: profile.avatarUrl || null,
      browser_notifications_enabled: Boolean(profile.browserNotificationsEnabled),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapProfileRecord(data);
  }

  async update(userId, updates) {
    const payload = {
      name: updates.name,
      last_name: updates.lastName,
      phone: updates.phone,
    };

    if (updates.browserNotificationsEnabled !== undefined) {
      payload.browser_notifications_enabled = Boolean(updates.browserNotificationsEnabled);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapProfileRecord(data);
  }
}
