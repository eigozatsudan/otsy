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
      baseURL: 'http://localhost:4000/v1',
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
      (config: any) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: any) => {
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
      localStorage.setItem('admin_auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_auth_token');
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

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  logout: () => apiClient.post('/auth/logout'),

  getProfile: () => apiClient.get<any>('/auth/profile'),
};

// Dashboard API methods
export const dashboardApi = {
  getMetrics: () => apiClient.get<any>('/admin/dashboard/metrics'),
  
  getRecentActivity: (params?: { limit?: number }) =>
    apiClient.get<any[]>('/admin/dashboard/activity', { params }),
    
  getChartData: (type: string, period: string) =>
    apiClient.get<any>(`/admin/dashboard/charts/${type}`, { params: { period } }),
};

// Users API methods
export const usersApi = {
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<PaginatedResponse<any>>('/admin/users', { params }),

  getUser: (userId: string) => apiClient.get<any>(`/admin/users/${userId}`),

  updateUser: (userId: string, data: any) => apiClient.patch<any>(`/admin/users/${userId}`, data),

  suspendUser: (userId: string, reason: string) =>
    apiClient.post<any>(`/admin/users/${userId}/suspend`, { reason }),

  reactivateUser: (userId: string) =>
    apiClient.post<any>(`/admin/users/${userId}/reactivate`),

  deleteUser: (userId: string) => apiClient.delete(`/admin/users/${userId}`),
};

// Shoppers API methods
export const shoppersApi = {
  getShoppers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<PaginatedResponse<any>>('/admin/shoppers', { params }),

  getShopper: (shopperId: string) => apiClient.get<any>(`/admin/shoppers/${shopperId}`),

  updateShopper: (shopperId: string, data: any) =>
    apiClient.patch<any>(`/admin/shoppers/${shopperId}`, data),

  approveKyc: (shopperId: string, riskTier: string) =>
    apiClient.post<any>(`/admin/shoppers/${shopperId}/kyc/approve`, { riskTier }),

  rejectKyc: (shopperId: string, reason: string) =>
    apiClient.post<any>(`/admin/shoppers/${shopperId}/kyc/reject`, { reason }),

  suspendShopper: (shopperId: string, reason: string) =>
    apiClient.post<any>(`/admin/shoppers/${shopperId}/suspend`, { reason }),

  reactivateShopper: (shopperId: string) =>
    apiClient.post<any>(`/admin/shoppers/${shopperId}/reactivate`),
};

// Orders API methods
export const ordersApi = {
  getOrders: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<PaginatedResponse<any>>('/admin/orders', { params }),

  getOrder: (orderId: string) => apiClient.get<any>(`/admin/orders/${orderId}`),

  updateOrderStatus: (orderId: string, status: string, reason?: string) =>
    apiClient.post<any>(`/admin/orders/${orderId}/status`, { status, reason }),

  assignShopper: (orderId: string, shopperId: string) =>
    apiClient.post<any>(`/admin/orders/${orderId}/assign`, { shopperId }),

  cancelOrder: (orderId: string, reason: string) =>
    apiClient.post<any>(`/admin/orders/${orderId}/cancel`, { reason }),

  getOrderStats: () => apiClient.get<any>('/admin/orders/stats'),
};

// Payments API methods
export const paymentsApi = {
  getPayments: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<PaginatedResponse<any>>('/payments/admin', { params }),

  getPayment: (paymentId: string) => apiClient.get<any>(`/payments/${paymentId}`),

  processRefund: (paymentId: string, amount?: number, reason?: string) =>
    apiClient.post<any>(`/payments/admin/refund`, { payment_id: paymentId, amount, reason }),

  getPaymentStats: () => apiClient.get<any>('/payments/stats/overview'),
};

// KYC API methods
export const kycApi = {
  getPendingKyc: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any>>('/admin/kyc/pending', { params }),

  getKycDocument: (documentId: string) => apiClient.get<any>(`/admin/kyc/documents/${documentId}`),

  approveKyc: (shopperId: string, riskTier: string, notes?: string) =>
    apiClient.post<any>(`/admin/kyc/${shopperId}/approve`, { riskTier, notes }),

  rejectKyc: (shopperId: string, reason: string, notes?: string) =>
    apiClient.post<any>(`/admin/kyc/${shopperId}/reject`, { reason, notes }),
};

// Audit logs API methods
export const auditApi = {
  getAuditLogs: (params?: { 
    page?: number; 
    limit?: number; 
    action?: string;
    actorRole?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<PaginatedResponse<any>>('/admin/audit-logs', { params }),

  getAuditLog: (logId: string) => apiClient.get<any>(`/admin/audit-logs/${logId}`),
};

// System settings API methods
export const settingsApi = {
  getSettings: () => apiClient.get<any>('/admin/settings'),

  updateSettings: (settings: any) => apiClient.patch<any>('/admin/settings', settings),

  getSystemHealth: () => apiClient.get<any>('/admin/system/health'),

  getSystemStats: () => apiClient.get<any>('/admin/system/stats'),
};

// Items API methods
export const itemsApi = {
  // Categories
  getCategories: () => apiClient.get<any[]>('/items/categories'),
  
  createCategory: (data: any) => apiClient.post<any>('/items/categories', data),
  
  updateCategory: (id: string, data: any) => apiClient.patch<any>(`/items/categories/${id}`, data),
  
  deleteCategory: (id: string) => apiClient.delete(`/items/categories/${id}`),
  
  // Items
  getItems: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    apiClient.get<PaginatedResponse<any>>('/items', { params }),
  
  getItem: (id: string) => apiClient.get<any>(`/items/${id}`),
  
  createItem: (data: any) => apiClient.post<any>('/items', data),
  
  updateItem: (id: string, data: any) => apiClient.patch<any>(`/items/${id}`, data),
  
  deleteItem: (id: string) => apiClient.delete(`/items/${id}`),
  
  searchItems: (query: string) => apiClient.get<any[]>(`/items/search?q=${encodeURIComponent(query)}`),
};

// Initialize token from localStorage on client side
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('admin_auth_token');
  if (token) {
    apiClient.setToken(token);
  }
}

export default apiClient;