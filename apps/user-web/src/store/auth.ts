'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.login(email, password);
          const { user, token, refreshToken } = response;

          // Set token in API client
          apiClient.setToken(token);

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('ログインしました');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.register(userData);
          const { user, token, refreshToken } = response;

          // Set token in API client
          apiClient.setToken(token);

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('アカウントを作成しました');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        try {
          // Call logout API (fire and forget)
          authApi.logout().catch(() => {
            // Ignore errors on logout
          });
        } catch {
          // Ignore errors
        }

        // Clear token from API client first
        apiClient.clearToken();

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });

        toast.success('ログアウトしました');
      },

      refreshAuth: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refreshToken(refreshToken);
          const { token: newToken, refreshToken: newRefreshToken } = response;

          // Set new token in API client
          apiClient.setToken(newToken);

          set({
            token: newToken,
            refreshToken: newRefreshToken,
          });
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true });
          
          const updatedUser = await authApi.updateProfile(data);
          
          set({
            user: updatedUser,
            isLoading: false,
          });

          toast.success('プロフィールを更新しました');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          const { token } = get();
          if (!token) {
            // No token, ensure we're logged out
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
            return;
          }

          set({ isLoading: true });
          
          const user = await authApi.getProfile();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // If check fails, clear auth state
          console.error('Auth check failed:', error);
          set({ isLoading: false });
          get().logout();
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in API client when rehydrating
        if (state?.token) {
          apiClient.setToken(state.token);
          // Ensure isAuthenticated is true if we have a token
          if (state.isAuthenticated !== true) {
            state.isAuthenticated = true;
          }
        } else if (state) {
          // No token, ensure we're logged out
          state.isAuthenticated = false;
          state.user = null;
        }
      },
    }
  )
);

// Auto-refresh token before expiration
let refreshTimer: NodeJS.Timeout | null = null;

export const startTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // Refresh token every 50 minutes (assuming 1 hour expiration)
  refreshTimer = setInterval(async () => {
    const { isAuthenticated, refreshAuth } = useAuthStore.getState();
    
    if (isAuthenticated) {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
  }, 50 * 60 * 1000); // 50 minutes
};

export const stopTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};