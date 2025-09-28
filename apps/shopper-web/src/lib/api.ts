'use client';

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Client Class
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private isRefreshing = false;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    console.log('API Client initialized with baseURL:', baseURL);
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
          tokenValue: token,
          tokenType: typeof token
        });
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        console.error('API Error Details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          config: error?.config,
          code: error?.code,
          name: error?.name,
          stack: error?.stack,
          fullError: error
        });
        
        const message = error.response?.data?.message || error.message || 'An error occurred';
        
        // Create apiError object first
        const apiError: ApiError = {
          message,
          statusCode: error.response?.status || 500,
          error: error.response?.data?.error || error.code || 'UNKNOWN_ERROR',
        };
        
        // Add more detailed error information
        (apiError as any).originalError = error;
        (apiError as any).responseData = error.response?.data;
        (apiError as any).requestConfig = error.config;
        (apiError as any).url = error.config?.url;
        (apiError as any).method = error.config?.method;
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          // Prevent infinite refresh loops
          if (this.isRefreshing) {
            console.log('Already refreshing token, skipping');
            this.clearToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
              window.location.href = '/auth/login';
            }
            return Promise.reject(apiError);
          }

          // Check if this is a refresh token request to avoid infinite loop
          if (error.config?.url?.includes('/auth/refresh')) {
            console.log('Refresh token request failed, logging out');
            this.clearToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
              window.location.href = '/auth/login';
            }
            return Promise.reject(apiError);
          }

          // Try to refresh token before giving up
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            console.log('401 error - attempting token refresh');
            this.isRefreshing = true;
            try {
              const response = await this.refreshToken(refreshToken);
              if (response) {
                console.log('Token refreshed successfully, retrying original request');
                // Retry the original request with the new token
                const originalRequest = error.config;
                originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
                this.isRefreshing = false;
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.isRefreshing = false;
            }
          }
          
          // If refresh failed or no refresh token, clear token and redirect
          this.clearToken();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            window.location.href = '/auth/login';
          }
        } else if (error.response?.status >= 500) {
          toast.error('サーバーエラーが発生しました。しばらく後でお試しください。');
        } else if (error.response?.status >= 400) {
          toast.error(message);
        }

        // Log the error for debugging
        console.error('API Error - Rejecting with:', {
          message: apiError.message,
          statusCode: apiError.statusCode,
          error: apiError.error,
          url: (apiError as any).url,
          method: (apiError as any).method,
          responseData: (apiError as any).responseData,
          originalError: (apiError as any).originalError
        });
        return Promise.reject(apiError);
      }
    );
  }

  setToken(token: string) {
    console.log('setToken() called with:', token ? token.substring(0, 20) + '...' : 'null', 'type:', typeof token);
    
    // Only set valid tokens
    if (token && token !== 'undefined' && token !== 'null' && typeof token === 'string') {
      this.token = token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopper_auth_token', token);
        console.log('Token saved to localStorage, verifying:', localStorage.getItem('shopper_auth_token') ? 'saved' : 'not saved');
      }
    } else {
      console.log('Invalid token provided, clearing token');
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shopper_auth_token');
      }
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopper_auth_token');
    }
  }

  getToken(): string | null {
    console.log('getToken() called - this.token:', this.token, 'type:', typeof this.token);
    
    if (this.token && this.token !== 'undefined' && this.token !== 'null') {
      console.log('Returning cached token:', this.token.substring(0, 20) + '...');
      return this.token;
    }
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('shopper_auth_token');
      console.log('localStorage token:', token, 'type:', typeof token);
      if (token && token !== 'undefined' && token !== 'null') {
        console.log('Loading token from localStorage:', token.substring(0, 20) + '...');
        this.token = token;
        return token;
      }
    }
    
    console.log('No valid token found');
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shopper_refresh_token');
    }
    return null;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      const response = await this.client.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      const { access_token, refresh_token } = response.data;
      
      // Update tokens
      this.setToken(access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopper_refresh_token', refresh_token);
      }
      
      return { access_token, refresh_token };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // File upload method
  async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post<T>(url, formData, config);
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Auth API methods
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ shopper: any; access_token: string; refresh_token: string }>('/auth/shopper/login', {
      email,
      password,
    }),

  register: (shopperData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) =>
    apiClient.post<{ shopper: any; access_token: string; refresh_token: string }>('/auth/shopper/register', shopperData),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  logout: () => apiClient.post('/auth/logout'),

  getProfile: () => apiClient.get<{ shopper: any }>('/auth/profile'),

  updateProfile: (data: any) => apiClient.patch<any>('/auth/profile', data),
};

// Helper function to transform API response to frontend format
const transformOrderResponse = (order: any) => {
  if (!order) {
    console.warn('transformOrderResponse called with undefined/null order');
    return null;
  }
  
  return {
    ...order,
    estimateAmount: order.estimate_amount,
    actualAmount: order.actual_amount,
    authAmount: order.auth_amount,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    deliveryAddress: order.address_json ? 
      `${order.address_json.postal_code} ${order.address_json.prefecture} ${order.address_json.city} ${order.address_json.address_line}` : 
      '',
    items: order.items?.map((item: any) => ({
      ...item,
      estimatePrice: item.price_min || item.price_max || 0,
      actualPrice: item.actual_price,
      notes: item.notes,
    })) || [],
  };
};

// Orders API methods (shopper perspective)
export const ordersApi = {
  getAvailableOrders: async (params?: { page?: number; limit?: number; location?: string }) => {
    try {
      const response = await apiClient.get<{ orders: any[]; pagination: any }>('/shopper/orders/available', { params });
      return {
        ...response,
        orders: response.orders?.map(transformOrderResponse).filter(Boolean) || []
      };
    } catch (error) {
      console.error('getAvailableOrders API error:', error);
      // Return mock data for development
      return {
        orders: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        }
      };
    }
  },

  getMyOrders: async (params?: { page?: number; limit?: number; status?: string }) => {
    try {
      const response = await apiClient.get<{ orders: any[]; pagination: any }>('/shopper/orders/my-orders', { params });
      return {
        ...response,
        orders: response.orders?.map(transformOrderResponse).filter(Boolean) || []
      };
    } catch (error) {
      console.error('getMyOrders API error:', error);
      // Return mock data for development
      return {
        orders: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        }
      };
    }
  },

  getOrder: async (orderId: string) => {
    try {
      const order = await apiClient.get<any>(`/shopper/orders/${orderId}`);
      return transformOrderResponse(order);
    } catch (error) {
      console.error('getOrder API error:', error);
      throw error;
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      console.log('Attempting to accept order:', orderId);
      const order = await apiClient.post<any>(`/orders/${orderId}/accept`, {
        note: '注文を受付ました',
        estimated_completion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2時間後
      });
      console.log('Order accepted successfully:', order);
      return transformOrderResponse(order);
    } catch (error) {
      console.error('acceptOrder API error for orderId:', orderId, error);
      throw error;
    }
  },

  startShopping: async (orderId: string) => {
    try {
      const order = await apiClient.patch<any>(`/orders/${orderId}/status`, {
        status: 'shopping',
        notes: '買い物を開始しました'
      });
      return transformOrderResponse(order);
    } catch (error) {
      console.error('startShopping API error:', error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: string, data?: any) => {
    try {
      const order = await apiClient.patch<any>(`/orders/${orderId}/status`, { status, ...data });
      return transformOrderResponse(order);
    } catch (error) {
      console.error('updateOrderStatus API error:', error);
      throw error;
    }
  },

  submitReceipt: async (orderId: string, receiptImage: File, actualItems: any[]) => {
    const formData = new FormData();
    formData.append('receipt', receiptImage);
    formData.append('actualItems', JSON.stringify(actualItems));
    formData.append('orderId', orderId);
    
    const receipt = await apiClient.post<any>(`/receipts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return receipt;
  },

  completeDelivery: async (orderId: string, deliveryProof?: File) => {
    try {
      const order = await apiClient.patch<any>(`/orders/${orderId}/status`, {
        status: 'delivered',
        notes: '配達が完了しました',
        delivery_proof: deliveryProof ? 'uploaded' : undefined
      });
      return transformOrderResponse(order);
    } catch (error) {
      console.error('completeDelivery API error:', error);
      throw error;
    }
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    try {
      const order = await apiClient.post<any>(`/shopper/orders/${orderId}/cancel`, { reason });
      return transformOrderResponse(order);
    } catch (error) {
      console.error('cancelOrder API error:', error);
      throw error;
    }
  },
};

// KYC API methods
export const kycApi = {
  getKycStatus: () => apiClient.get<any>('/kyc/status'),

  uploadDocument: (documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    
    return apiClient.post<any>('/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  submitKyc: (kycData: any) => apiClient.post<any>('/kyc/submit', kycData),
};

// Chat API methods
export const chatApi = {
  getOrderMessages: (orderId: string) => apiClient.get<any>(`/chat/orders/${orderId}/messages`),

  sendMessage: (orderId: string, message: string, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('message', message);
    
    if (attachments) {
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    return apiClient.post<any>(`/chat/orders/${orderId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  markMessagesAsRead: (orderId: string) =>
    apiClient.post<any>(`/chat/orders/${orderId}/mark-read`),
};

// Earnings API methods
export const earningsApi = {
  getEarnings: (params?: { from?: string; to?: string }) =>
    apiClient.get<any>('/shoppers/earnings', { params }),

  getEarningsStats: () => apiClient.get<any>('/shoppers/earnings/stats'),

  requestPayout: (amount: number, method: string) =>
    apiClient.post<any>('/shoppers/earnings/payout', { amount, method }),
};

// Shopper status API methods
export const statusApi = {
  updateStatus: (status: 'available' | 'busy' | 'offline') =>
    apiClient.post<any>('/shoppers/status', { status }),

  getStatus: () => apiClient.get<any>('/shoppers/status'),

  updateLocation: (latitude: number, longitude: number) =>
    apiClient.post<any>('/shoppers/location', { latitude, longitude }),
};

// Initialize token from localStorage on client side
if (typeof window !== 'undefined') {
  console.log('Initializing API client from localStorage...');
  const token = localStorage.getItem('shopper_auth_token');
  console.log('Found token in localStorage:', token ? token.substring(0, 20) + '...' : 'null', 'type:', typeof token);
  if (token) {
    apiClient.setToken(token);
  } else {
    console.log('No token found in localStorage');
  }
  
  // Test API connection on client side
  console.log('Testing API connection...');
  apiClient.get('/health').then(response => {
    console.log('API health check successful:', response);
  }).catch(error => {
    console.error('API health check failed:', error);
    console.log('This is expected if the API server is not running');
  });
}

export default apiClient;