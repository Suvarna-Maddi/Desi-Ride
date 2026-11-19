import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  getAccessToken,
  setTokens,
  clearTokens,
  getDashboardPathForRole,
} from '../services/api';
import { LoginPayload, RegisterPayload, UserProfile } from '../types/auth';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentPath: string;
  navigate: (path: string) => void;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  const navigate = useCallback((path: string) => {
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getMe();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (payload: LoginPayload): Promise<UserProfile> => {
    const res = await authApi.login(payload);
    setTokens(res.access, res.refresh, payload.remember_me ?? true);
    const verifiedProfile = await authApi.getMe();
    setUser(verifiedProfile);
    return verifiedProfile;
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    const res = await authApi.register(payload);
    setTokens(res.access, res.refresh, true);
    const verifiedProfile = await authApi.getMe();
    setUser(verifiedProfile);
    return verifiedProfile;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      clearTokens();
    }
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        currentPath,
        navigate,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export { getDashboardPathForRole };

