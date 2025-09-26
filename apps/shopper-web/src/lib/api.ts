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

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
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
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            window.location.href = '/auth/login';
          }
        } else if (error.response?.status >= 500) {
          toast.error('サーバーエラーが発生しました。しばらく後でお試しください。');
        } else if (error.response?.status >= 400) {
          toast.error(message);
        }

        return Promise.reject({
          message,
          statusCode: error.response?.status || 500,
          error: error.response?.data?.error,
        } as ApiError);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('shopper_auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopper_auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('shopper_auth_token');
      if (token) {
        this.token = token;
        return token;
      }
    }
    
    return null;
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
    apiClient.post<{ shopper: any; token: string; refreshToken: string }>('/auth/shopper/login', {
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
    apiClient.post<{ shopper: any; token: string; refreshToken: string }>('/auth/shopper/register', shopperData),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    }),

  logout: () => apiClient.post('/auth/logout'),

  getProfile: () => apiClient.get<any>('/auth/profile'),

  updateProfile: (data: any) => apiClient.patch<any>('/auth/profile', data),
};

// Orders API methods (shopper perspective)
export const ordersApi = {
  getAvailableOrders: (params?: { page?: number; limit?: number; location?: string }) =>
    apiClient.get<PaginatedResponse<any>>('/shoppers/orders/available', { params }),

  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<any>>('/shoppers/orders/my-orders', { params }),

  getOrder: (orderId: string) => apiClient.get<any>(`/shoppers/orders/${orderId}`),

  acceptOrder: (orderId: string) => apiClient.post<any>(`/shoppers/orders/${orderId}/accept`),

  startShopping: (orderId: string) => apiClient.post<any>(`/shoppers/orders/${orderId}/start-shopping`),

  updateOrderStatus: (orderId: string, status: string, data?: any) =>
    apiClient.post<any>(`/shoppers/orders/${orderId}/status`, { status, ...data }),

  submitReceipt: (orderId: string, receiptImage: File, actualItems: any[]) => {
    const formData = new FormData();
    formData.append('receipt', receiptImage);
    formData.append('actualItems', JSON.stringify(actualItems));
    
    return apiClient.post<any>(`/shoppers/orders/${orderId}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  completeDelivery: (orderId: string, deliveryProof?: File) => {
    const formData = new FormData();
    if (deliveryProof) {
      formData.append('deliveryProof', deliveryProof);
    }
    
    return apiClient.post<any>(`/shoppers/orders/${orderId}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// KYC API methods
export const kycApi = {
  getKycStatus: () => apiClient.get<any>('/shoppers/kyc/status'),

  uploadDocument: (documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    
    return apiClient.post<any>('/shoppers/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  submitKyc: (kycData: any) => apiClient.post<any>('/shoppers/kyc/submit', kycData),
};

// Chat API methods
export const chatApi = {
  getOrderMessages: (orderId: string) => apiClient.get<any[]>(`/chat/orders/${orderId}/messages`),

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
  const token = localStorage.getItem('shopper_auth_token');
  if (token) {
    apiClient.setToken(token);
  }
}

export default apiClient;