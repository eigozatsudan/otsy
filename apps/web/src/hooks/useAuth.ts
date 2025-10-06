import { useMutation, useQuery, useQueryClient } from 'react-query';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    display_name?: string;
    role: string;
  };
}

interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
}

// Auth API functions
const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'ログインに失敗しました');
    }

    return response.json();
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.request<{ user: User }>('/auth/me').then(res => res.user);
  },
};

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Set token in API client
      apiClient.setToken(data.access_token);
      
      // Cache user data
      queryClient.setQueryData(['auth', 'user'], data.user);
      
      toast.success('ログインしました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear API client token
    apiClient.setToken('');
    
    // Clear all cached data
    queryClient.clear();
    
    toast.success('ログアウトしました');
  };
};

// Initialize auth on app start
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      apiClient.setToken(token);
    }
  }
};