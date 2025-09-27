'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Shopper {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalOrders: number;
  kycStatus: 'pending' | 'approved' | 'rejected';
  riskTier: 'L0' | 'L1' | 'L2' | 'L-1';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  shopper: Shopper | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (shopperData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<Shopper>) => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateStatus: (status: 'available' | 'busy' | 'offline') => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      shopper: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.login(email, password);
          const { shopper, token, refreshToken } = response;

          // Set token in API client
          apiClient.setToken(token);

          set({
            shopper,
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

      register: async (shopperData) => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.register(shopperData);
          const { shopper, token, refreshToken } = response;

          // Set token in API client
          apiClient.setToken(token);

          set({
            shopper,
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

        // Clear token from API client
        apiClient.clearToken();

        set({
          shopper: null,
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
          
          const updatedShopper = await authApi.updateProfile(data);
          
          set({
            shopper: updatedShopper,
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
            return;
          }

          set({ isLoading: true });
          
          const shopper = await authApi.getProfile();
          
          set({
            shopper,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // If check fails, clear auth state
          get().logout();
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateStatus: (status: 'available' | 'busy' | 'offline') => {
        const { shopper } = get();
        if (shopper) {
          set({
            shopper: { ...shopper, status },
          });
        }
      },
    }),
    {
      name: 'shopper-auth-storage',
      partialize: (state) => ({
        shopper: state.shopper,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in API client when rehydrating
        if (state?.token) {
          apiClient.setToken(state.token);
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