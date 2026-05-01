const DEFAULT_AVATAR = "/icon.jpg";

export const getAuthAvatar = (authUser) =>
  authUser?.user_metadata?.avatar_url ||
  authUser?.user_metadata?.picture ||
  null;

export const resolveUserAvatar = (profile, authUser) =>
  profile?.avatarUrl || getAuthAvatar(authUser) || DEFAULT_AVATAR;
