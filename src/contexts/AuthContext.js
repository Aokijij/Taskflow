import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { serviceFactory } from "../core/factory/serviceFactory";

const AuthContext = createContext(null);
const authService = serviceFactory.createAuthService();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (authUser) => {
    const profileData = await authService.ensureProfile(authUser);
    setProfile(profileData);
    return profileData;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const currentSession = await authService.getSession();

      if (!isMounted) {
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        return;
      }

      try {
        const profileData = await ensureProfile(user);
        if (!ignore) {
          setProfile(profileData);
        }
      } catch (_error) {
        if (!ignore) {
          setProfile(null);
        }
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [ensureProfile, user]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    return ensureProfile(user);
  }, [ensureProfile, user]);

  const register = useCallback(
    async ({ email, password, name, lastName, phone }) => {
      const data = await authService.register({ email, password, name, lastName, phone });

      if (data.user && data.session) {
        await ensureProfile(data.user);
      }

      return data;
    },
    [ensureProfile]
  );

  const login = useCallback(
    async ({ email, password }) => {
      const data = await authService.login({ email, password });
      await ensureProfile(data.user);
      return data;
    },
    [ensureProfile]
  );

  const loginWithGoogle = useCallback(async () => authService.loginWithGoogle(), []);

  const logout = useCallback(async () => {
    await authService.logout();
    setProfile(null);
  }, []);

  const updatePassword = useCallback(async (password) => authService.updatePassword(password), []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      isAuthenticated: Boolean(session?.user),
      login,
      loginWithGoogle,
      register,
      logout,
      updatePassword,
      refreshProfile,
      setProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      login,
      loginWithGoogle,
      logout,
      updatePassword,
      refreshProfile,
      register,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
