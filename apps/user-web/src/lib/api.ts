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
          console.log('401 Unauthorized error detected, clearing token');
          this.clearToken();
          // Don't automatically redirect - let the auth store handle it
          // This prevents conflicts with login flow
        } else if (error.response?.status === 404) {
          // Don't show toast for 404 errors - let the calling code handle it
          // For 404 errors, create a special error that can be handled by the calling code
          const apiError = new Error(message);
          (apiError as any).statusCode = 404;
          (apiError as any).error = error.response?.data?.error;
          (apiError as any).originalError = error;
          (apiError as any).response = error.response?.data;
          return Promise.reject(apiError);
        } else if (error.response?.status >= 500) {
          toast.error('サーバーエラーが発生しました。しばらく後でお試しください。');
        } else if (error.response?.status >= 400) {
          toast.error(message);
        }

        // Create a proper error object
        const apiError = new Error(message);
        (apiError as any).statusCode = error.response?.status || 500;
        (apiError as any).error = error.response?.data?.error;
        (apiError as any).originalError = error;
        (apiError as any).response = error.response?.data;

        return Promise.reject(apiError);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
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
    apiClient.post<{ user: any; access_token: string; refresh_token: string }>('/auth/login', {
      email,
      password,
    }),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) =>
    apiClient.post<{ user: any; access_token: string; refresh_token: string }>('/auth/register', userData),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  logout: () => apiClient.post('/auth/logout'),

  getProfile: () => apiClient.get<any>('/auth/profile'),

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

// Orders API methods
export const ordersApi = {
  createOrder: (orderData: any) => apiClient.post<any>('/orders', orderData),

  getMyOrders: async (params?: { page?: number; limit?: number; status?: string }) => {
    console.log('getMyOrders called with params:', params);
    const response = await apiClient.get<PaginatedResponse<any>>('/orders/my-orders', { params });
    console.log('Raw API Response:', response);
    console.log('Response data:', response.data);
    console.log('Response status:', response.status);
    
    // Check if the response structure is different than expected
    let apiData;
    if (response.data && typeof response.data === 'object') {
      apiData = response.data;
    } else if (response && typeof response === 'object' && response.orders) {
      // If the response itself contains the data (not in response.data)
      apiData = response;
    } else {
      console.warn('Unexpected response structure:', response);
      apiData = response.data || response;
    }
    
    console.log('API Data:', apiData);
    console.log('API Data type:', typeof apiData);
    console.log('API Data is array:', Array.isArray(apiData));
    if (apiData && typeof apiData === 'object') {
      console.log('API Data keys:', Object.keys(apiData));
    }
    
    // Handle different response structures
    if (Array.isArray(apiData)) {
      // If the response is directly an array of orders
      return {
        ...response,
        data: {
          orders: apiData.map(transformOrderResponse).filter(Boolean),
          meta: {
            total: apiData.length,
            page: 1,
            limit: apiData.length,
            totalPages: 1,
          }
        }
      };
    } else if (apiData && apiData.orders) {
      // If the response has orders property (expected structure)
      return {
        ...response,
        data: {
          orders: apiData.orders.map(transformOrderResponse).filter(Boolean),
          meta: apiData.pagination || {
            total: apiData.orders.length,
            page: 1,
            limit: apiData.orders.length,
            totalPages: 1,
          }
        }
      };
    } else {
      // Fallback for unexpected structure
      console.warn('Unexpected API response structure:', apiData);
      return {
        ...response,
        data: {
          orders: [],
          meta: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          }
        }
      };
    }
  },

  getOrder: async (orderId: string) => {
    console.log('getOrder called with orderId:', orderId);
    const response = await apiClient.get<any>(`/orders/${orderId}`);
    console.log('getOrder response:', response);
    console.log('getOrder response.data:', response.data);
    console.log('getOrder response.status:', response.status);
    
    // Check if the response structure is different than expected
    let orderData;
    if (response.data && typeof response.data === 'object') {
      orderData = response.data;
    } else if (response && typeof response === 'object' && response.id) {
      // If the response itself contains the order data (not in response.data)
      orderData = response;
    } else {
      console.warn('getOrder: Unexpected response structure:', response);
      throw new Error('Order not found');
    }
    
    console.log('getOrder orderData:', orderData);
    
    if (!orderData) {
      console.warn('getOrder: orderData is undefined');
      throw new Error('Order not found');
    }
    
    return transformOrderResponse(orderData);
  },

  updateOrder: (orderId: string, data: any) => apiClient.patch<any>(`/orders/${orderId}`, data),

  cancelOrder: async (orderId: string, reason: string) => {
    const response = await apiClient.delete<any>(`/orders/${orderId}`, { data: { reason } });
    
    // Check if the response structure is different than expected
    let orderData;
    if (response.data && typeof response.data === 'object') {
      orderData = response.data;
    } else if (response && typeof response === 'object' && response.id) {
      orderData = response;
    } else {
      console.warn('cancelOrder: Unexpected response structure:', response);
      throw new Error('Failed to cancel order');
    }
    
    if (!orderData) {
      console.warn('cancelOrder: orderData is undefined');
      throw new Error('Failed to cancel order');
    }
    
    return transformOrderResponse(orderData);
  },

  approveReceipt: async (orderId: string) => {
    const response = await apiClient.post<any>(`/orders/${orderId}/approve-receipt`);
    
    // Check if the response structure is different than expected
    let orderData;
    if (response.data && typeof response.data === 'object') {
      orderData = response.data;
    } else if (response && typeof response === 'object' && response.id) {
      orderData = response;
    } else {
      console.warn('approveReceipt: Unexpected response structure:', response);
      throw new Error('Failed to approve receipt');
    }
    
    if (!orderData) {
      console.warn('approveReceipt: orderData is undefined');
      throw new Error('Failed to approve receipt');
    }
    
    return transformOrderResponse(orderData);
  },

  rejectReceipt: (orderId: string, reason: string) =>
    apiClient.post<any>(`/orders/${orderId}/reject-receipt`, { reason }),

  generateShoppingList: (voiceData: any) =>
    apiClient.post<{ items: any[]; totalEstimate: number }>('/orders/generate-list', voiceData),
};

// Items API methods
export const itemsApi = {
  getCategories: () => apiClient.get<any[]>('/items/categories'),
  
  getItems: () => apiClient.get<any[]>('/items'),
  
  getItemsByCategory: (categoryId: string) => 
    apiClient.get<any[]>(`/items/category/${categoryId}`),
  
  searchItems: (query: string) => 
    apiClient.get<any[]>(`/items/search?q=${encodeURIComponent(query)}`),
};

// Payments API methods
export const paymentsApi = {
  createPaymentIntent: (orderData: { order_id: string; amount: number }) =>
    apiClient.post<{ id: string; client_secret: string; status: string; amount: number }>(
      '/payments/create-intent',
      orderData
    ),

  confirmPayment: (paymentId: string, paymentMethodId: string) =>
    apiClient.post<any>(`/payments/${paymentId}/confirm`, {
      payment_method_id: paymentMethodId,
    }),

  getMyPayments: async () => {
    try {
      console.log('Making payments API request...');
      const result = await apiClient.get<any[]>('/payments/my-payments');
      console.log('Payments API response:', result);
      return result;
    } catch (error: any) {
      // Handle specific error cases
      if (error?.statusCode === 404 || error?.message === 'Payment not found' || error?.response?.statusCode === 404) {
        // Return empty array for no payments found
        return [];
      }
      
      // Re-throw the error with proper message
      const errorMessage = error?.message || error?.response?.data?.message || '決済履歴の取得に失敗しました';
      const newError = new Error(errorMessage);
      (newError as any).statusCode = error?.statusCode;
      (newError as any).response = error?.response;
      throw newError;
    }
  },

  getPayment: (paymentId: string) => apiClient.get<any>(`/payments/${paymentId}`),

  getOrderPaymentSummary: (orderId: string) =>
    apiClient.get<any>(`/payments/orders/${orderId}/summary`),
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

// Storage API methods
export const storageApi = {
  getUploadUrl: (fileName: string, fileType: string) =>
    apiClient.post<{ uploadUrl: string; fileUrl: string }>('/storage/upload-url', {
      fileName,
      fileType,
    }),

  uploadToSignedUrl: async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response;
  },
};

// Initialize token from localStorage on client side
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    apiClient.setToken(token);
  }
}

export default apiClient;