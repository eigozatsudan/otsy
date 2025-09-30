import { create } from 'zustand';
import { ordersApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './auth';

export interface OrderItem {
  id?: string;
  name: string;
  qty: string;
  estimatePrice?: number;
  actualPrice?: number;
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  shopperId?: string;
  status: string;
  estimateAmount: number;
  actualAmount?: number;
  authAmount?: number;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTimeSlot?: string;
  specialInstructions?: string;
  items: OrderItem[];
  receiptUrl?: string;
  receiptStatus?: string;
  createdAt: string;
  updatedAt: string;
  shopper?: {
    id: string;
    firstName: string;
    lastName: string;
    rating: number;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ShoppingListItem {
  name: string;
  qty: string;
  estimatePrice: number;
  category?: string;
  confidence?: number;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  isCreatingOrder: boolean;
  isGeneratingList: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

interface OrdersActions {
  // Order management
  fetchOrders: (params?: { page?: number; limit?: number; status?: string }) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (orderData: {
    items: OrderItem[];
    deliveryAddress: string;
    deliveryDate: string;
    deliveryTimeSlot?: string;
    specialInstructions?: string;
  }) => Promise<Order>;
  updateOrder: (orderId: string, data: Partial<Order>) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  
  // Receipt management
  approveReceipt: (orderId: string) => Promise<void>;
  rejectReceipt: (orderId: string, reason: string) => Promise<void>;
  
  // Shopping list generation
  generateShoppingList: (voiceData: {
    transcript?: string;
    audioUrl?: string;
    preferences?: any;
  }) => Promise<ShoppingListItem[]>;
  
  // State management
  setCurrentOrder: (order: Order | null) => void;
  setFilters: (filters: Partial<OrdersState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  clearOrders: () => void;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  // Initial state
  orders: [],
  currentOrder: null,
  isLoading: false,
  isCreatingOrder: false,
  isGeneratingList: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},

  // Actions
  fetchOrders: async (params) => {
    try {
      set({ isLoading: true });
      
      const { filters } = get();
      const queryParams = {
        ...filters,
        ...params,
      };

      // Check authentication state before making API call
      const authState = useAuthStore.getState();
      console.log('fetchOrders - Auth state:', {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        hasToken: !!authState.token,
        tokenLength: authState.token?.length,
        tokenStart: authState.token?.substring(0, 20) + '...',
        userEmail: authState.user?.email
      });

      // If not authenticated, redirect to login
      if (!authState.isAuthenticated || !authState.token) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = '/auth/login';
        return;
      }

      const response = await ordersApi.getMyOrders(queryParams);
      console.log('Store - API response:', response);
      console.log('Store - Response data:', response.data);
      console.log('Store - Response orders:', response.data?.orders);
      
      // API client already handles transformation, so use the data directly
      const ordersData = response.data?.orders || [];
      console.log('Store - Orders data:', ordersData);
      console.log('Store - Orders data length:', ordersData.length);
      console.log('Store - Orders data type:', typeof ordersData);
      console.log('Store - Orders data is array:', Array.isArray(ordersData));
      
      set({
        orders: ordersData,
        pagination: response.data?.meta || response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Error fetching orders:', error);
      
      // Handle specific error cases
      if (error?.statusCode === 401) {
        console.log('401 Unauthorized in fetchOrders, redirecting to login');
        // Clear auth state and redirect to login
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return;
      }
      
      toast.error('注文の取得に失敗しました');
      throw error;
    }
  },

  fetchOrder: async (orderId: string) => {
    try {
      set({ isLoading: true });
      
      const order = await ordersApi.getOrder(orderId);
      
      set({
        currentOrder: order,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('注文の詳細取得に失敗しました');
      throw error;
    }
  },

  createOrder: async (orderData) => {
    try {
      set({ isCreatingOrder: true });
      
      const order = await ordersApi.createOrder(orderData);
      
      // API client already handles transformation, so use the data directly
      const transformedOrder = order;
      
      // Add to orders list
      const { orders } = get();
      set({
        orders: [transformedOrder, ...(orders || [])],
        currentOrder: transformedOrder,
        isCreatingOrder: false,
      });

      toast.success('注文を作成しました');
      return transformedOrder;
    } catch (error: any) {
      set({ isCreatingOrder: false });
      toast.error('注文の作成に失敗しました');
      throw error;
    }
  },

  updateOrder: async (orderId: string, data) => {
    try {
      set({ isLoading: true });
      
      const updatedOrder = await ordersApi.updateOrder(orderId, data);
      
      // Update in orders list
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order => 
        order.id === orderId ? updatedOrder : order
      );
      
      set({
        orders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? updatedOrder : currentOrder,
        isLoading: false,
      });

      toast.success('注文を更新しました');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('注文の更新に失敗しました');
      throw error;
    }
  },

  cancelOrder: async (orderId: string, reason: string) => {
    try {
      set({ isLoading: true });
      
      const updatedOrder = await ordersApi.cancelOrder(orderId, reason);
      
      // Update in orders list
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order => 
        order.id === orderId ? updatedOrder : order
      );
      
      set({
        orders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? updatedOrder : currentOrder,
        isLoading: false,
      });

      toast.success('注文をキャンセルしました');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('注文のキャンセルに失敗しました');
      throw error;
    }
  },

  approveReceipt: async (orderId: string) => {
    try {
      set({ isLoading: true });
      
      const updatedOrder = await ordersApi.approveReceipt(orderId);
      
      // Update in orders list
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order => 
        order.id === orderId ? updatedOrder : order
      );
      
      set({
        orders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? updatedOrder : currentOrder,
        isLoading: false,
      });

      toast.success('レシートを承認しました');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('レシート承認に失敗しました');
      throw error;
    }
  },

  rejectReceipt: async (orderId: string, reason: string) => {
    try {
      set({ isLoading: true });
      
      const updatedOrder = await ordersApi.rejectReceipt(orderId, reason);
      
      // Update in orders list
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order => 
        order.id === orderId ? updatedOrder : order
      );
      
      set({
        orders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? updatedOrder : currentOrder,
        isLoading: false,
      });

      toast.success('レシートを差し戻しました');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('レシート差し戻しに失敗しました');
      throw error;
    }
  },

  generateShoppingList: async (voiceData) => {
    try {
      set({ isGeneratingList: true });
      
      const response = await ordersApi.generateShoppingList(voiceData);
      
      set({ isGeneratingList: false });
      
      toast.success('買い物リストを生成しました');
      return response.items;
    } catch (error: any) {
      set({ isGeneratingList: false });
      toast.error('買い物リストの生成に失敗しました');
      throw error;
    }
  },

  setCurrentOrder: (order) => {
    set({ currentOrder: order });
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  clearOrders: () => {
    set({
      orders: [],
      currentOrder: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {},
    });
  },
}));

// Helper functions for order status
export const getOrderStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'new':
      return 'badge-gray';
    case 'accepted':
      return 'badge-primary';
    case 'shopping':
      return 'badge-warning';
    case 'enroute':
      return 'badge-warning';
    case 'delivered':
      return 'badge-success';
    case 'cancelled':
      return 'badge-error';
    default:
      return 'badge-gray';
  }
};

export const getOrderStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'new':
      return '新規';
    case 'accepted':
      return '受付済み';
    case 'shopping':
      return '買い物中';
    case 'enroute':
      return '配送中';
    case 'delivered':
      return '配送完了';
    case 'cancelled':
      return 'キャンセル';
    default:
      return status;
  }
};