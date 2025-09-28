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
  isCheckingAuth: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
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
      isCheckingAuth: false,

      // Actions
      login: async (email: string, password: string): Promise<boolean> => {
        try {
          console.log('Auth store: Starting login...');
          set({ isLoading: true });
          
          const response = await authApi.login(email, password);
          console.log('Auth store: API response:', response);
          const { user, access_token, refresh_token } = response;

          // Set token in API client
          apiClient.setToken(access_token);

          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('Auth store: Login successful, state updated');
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

      register: async (userData) => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.register(userData);
          const { user, access_token, refresh_token } = response;

          // Set token in API client
          apiClient.setToken(access_token);

          set({
            user,
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

        // Clear token from API client first
        apiClient.clearToken();

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          isCheckingAuth: false,
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
        const { isCheckingAuth, token, isAuthenticated } = get();
        
        // Prevent duplicate auth checks
        if (isCheckingAuth) {
          console.log('Auth check already in progress, skipping...');
          return;
        }
        
        // Check if token is expired
        if (token) {
          try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const isExpired = payload.exp < Math.floor(Date.now() / 1000);
            if (isExpired) {
              console.log('Token expired, logging out');
              set({
                user: null,
                isAuthenticated: false,
                token: null,
                refreshToken: null,
                isLoading: false,
                isCheckingAuth: false
              });
              apiClient.clearToken();
              return;
            }
          } catch (error) {
            console.log('Invalid token format, logging out');
            set({
              user: null,
              isAuthenticated: false,
              token: null,
              refreshToken: null,
              isLoading: false,
              isCheckingAuth: false
            });
            apiClient.clearToken();
            return;
          }
        }
        
        // If already authenticated and have user data, skip check
        if (isAuthenticated && get().user) {
          console.log('Already authenticated, skipping auth check');
          return;
        }
        
        try {
          console.log('Starting auth check...', {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenStart: token?.substring(0, 20) + '...'
          });
          
          if (!token) {
            // No token, ensure we're logged out
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              isCheckingAuth: false
            });
            return;
          }

          set({ isLoading: true, isCheckingAuth: true });
          
          // Verify token by getting user profile
          console.log('Calling authApi.getProfile()...');
          const user = await authApi.getProfile();
          console.log('Auth profile response:', user);
          
          console.log('Auth check successful, setting user data');
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isCheckingAuth: false,
          });
        } catch (error: any) {
          // If check fails, clear auth state
          console.error('Auth check failed:', {
            error,
            message: error?.message,
            statusCode: error?.statusCode,
            response: error?.response,
            stack: error?.stack
          });
          
          // Only clear auth state if it's a 401 (unauthorized) error
          // For network errors, keep the token but mark as not authenticated
          if (error?.statusCode === 401) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              isCheckingAuth: false
            });
            // Clear token from API client
            apiClient.clearToken();
          } else {
            // For other errors (network, server), just mark as not authenticated
            // but keep the token for retry
            set({ 
              isAuthenticated: false, 
              isLoading: false,
              isCheckingAuth: false
            });
          }
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
        // Don't persist loading states
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in API client when rehydrating
        if (state?.token) {
          apiClient.setToken(state.token);
          // Don't automatically set isAuthenticated to true here
          // Let checkAuth() verify the token validity
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