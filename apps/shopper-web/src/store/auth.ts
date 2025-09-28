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
  login: (email: string, password: string) => Promise<boolean>;
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
      login: async (email: string, password: string): Promise<boolean> => {
        try {
          console.log('Shopper auth store: Starting login...');
          set({ isLoading: true });
          
          const response = await authApi.login(email, password);
          console.log('Shopper auth store: API response:', response);
          const { shopper, access_token, refresh_token } = response;

          // Set token in API client
          apiClient.setToken(access_token);

          // Save refresh token to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('shopper_refresh_token', refresh_token);
          }

          set({
            shopper,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('Shopper auth store: Login successful, state updated');
          console.log('Shopper auth store: isAuthenticated set to true');
          console.log('Shopper auth store: shopper data:', shopper);
          toast.success('ログインしました');
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          
          // Log detailed error information
          console.error('Auth store login error:', {
            message: error?.message,
            statusCode: error?.statusCode,
            error: error?.error,
            fullError: error,
            stack: error?.stack
          });
          
          // Show user-friendly error message
          let errorMessage = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
          
          if (error?.statusCode === 401) {
            errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
          } else if (error?.statusCode >= 500) {
            errorMessage = 'サーバーエラーが発生しました。しばらく後でお試しください。';
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
          
          // Return false to indicate login failure
          return false;
        }
      },

      register: async (shopperData) => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.register(shopperData);
          const { shopper, access_token, refresh_token } = response;

          // Set token in API client
          apiClient.setToken(access_token);

          // Save refresh token to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('shopper_refresh_token', refresh_token);
          }

          set({
            shopper,
            token: access_token,
            refreshToken: refresh_token,
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

        // Clear refresh token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('shopper_refresh_token');
        }

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
          const { access_token: newToken, refresh_token: newRefreshToken } = response;

          // Set new token in API client
          apiClient.setToken(newToken);

          // Save new refresh token to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('shopper_refresh_token', newRefreshToken);
          }

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
          
          const response = await authApi.updateProfile(data);
          const { shopper: updatedShopper } = response;
          
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
          const { token, isLoading, shopper, isAuthenticated } = get();
          
          console.log('checkAuth called - token exists:', !!token, 'isLoading:', isLoading, 'shopper exists:', !!shopper, 'isAuthenticated:', isAuthenticated);
          console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
          
          // If no token, we're not authenticated
          if (!token) {
            console.log('No token found, setting as not authenticated');
            set({ isAuthenticated: false, isLoading: false });
            return;
          }
          
          // If already loading, don't start another check
          if (isLoading) {
            console.log('Already loading, skipping check');
            return;
          }

          // If we're already authenticated and have shopper data, don't check again
          if (isAuthenticated && shopper) {
            console.log('Already authenticated with shopper data, skipping check');
            return;
          }

          // If we have a token and shopper data, we're already authenticated
          if (shopper) {
            console.log('Have token and shopper data, setting as authenticated');
            set({ isAuthenticated: true, isLoading: false });
            return;
          }

          // If we have a token but no shopper data, verify with API
          console.log('Have token but no shopper data, verifying with API');
          set({ isLoading: true });
          
          const response = await authApi.getProfile();
          const { shopper: profileShopper } = response;
          
          console.log('Profile API response:', profileShopper);
          
          set({
            shopper: profileShopper,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check failed:', {
            message: error?.message,
            statusCode: error?.statusCode,
            error: error?.error,
            fullError: error,
            stack: error?.stack
          });
          set({ isLoading: false });
          // Only logout if it's an authentication error, not a network error
          if (error?.statusCode === 401 || error?.statusCode === 403) {
            console.log('Authentication error, logging out');
            get().logout();
          } else {
            // For other errors, just set as not authenticated but keep token
            console.log('Network error, keeping token but setting as not authenticated');
            set({ isAuthenticated: false });
          }
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
        console.log('Rehydrating auth state:', {
          hasToken: !!state?.token,
          hasShopper: !!state?.shopper,
          isAuthenticated: state?.isAuthenticated
        });
        
        // Set token in API client when rehydrating
        if (state?.token) {
          apiClient.setToken(state.token);
          // If we have a token and shopper data, we should be authenticated
          if (state.shopper) {
            console.log('Setting isAuthenticated to true on rehydration');
            state.isAuthenticated = true;
          }
        }

        // Load refresh token from localStorage if not in state
        if (typeof window !== 'undefined' && !state?.refreshToken) {
          const refreshToken = localStorage.getItem('shopper_refresh_token');
          if (refreshToken) {
            state.refreshToken = refreshToken;
          }
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