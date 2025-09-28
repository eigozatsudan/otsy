import { create } from 'zustand';
import { ordersApi, apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface OrderItem {
  id?: string;
  name: string;
  qty: string;
  estimatePrice?: number;
  actualPrice?: number;
  notes?: string;
  found?: boolean;
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
  distance?: number;
  estimatedEarnings?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface OrdersState {
  availableOrders: Order[];
  myOrders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  isAccepting: boolean;
  isUpdating: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    location?: string;
    minEarnings?: number;
  };
}

interface OrdersActions {
  // Available orders
  fetchAvailableOrders: (params?: { page?: number; limit?: number; location?: string }) => Promise<void>;
  
  // My orders
  fetchMyOrders: (params?: { page?: number; limit?: number; status?: string }) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  
  // Order actions
  acceptOrder: (orderId: string) => Promise<void>;
  startShopping: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, data?: any) => Promise<void>;
  submitReceipt: (orderId: string, receiptImage: File, actualItems: OrderItem[]) => Promise<void>;
  completeDelivery: (orderId: string, deliveryProof?: File) => Promise<void>;
  
  // State management
  setCurrentOrder: (order: Order | null) => void;
  setFilters: (filters: Partial<OrdersState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  clearOrders: () => void;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  // Initial state
  availableOrders: [],
  myOrders: [],
  currentOrder: null,
  isLoading: false,
  isAccepting: false,
  isUpdating: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},

  // Actions
  fetchAvailableOrders: async (params) => {
    try {
      set({ isLoading: true });
      
      const { filters } = get();
      const queryParams = {
        ...filters,
        ...params,
      };

      console.log('Fetching available orders with params:', queryParams);
      console.log('API client token:', apiClient.getToken());
      
      const response = await ordersApi.getAvailableOrders(queryParams);
      
      set({
        availableOrders: response.orders || [],
        pagination: {
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 10,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.pages || 0,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Failed to fetch available orders - Full error details:', {
        message: error?.message,
        statusCode: error?.statusCode,
        error: error?.error,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
        fullError: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
      });
      toast.error('利用可能な注文の取得に失敗しました');
      throw error;
    }
  },

  fetchMyOrders: async (params) => {
    try {
      set({ isLoading: true });
      
      const { filters } = get();
      const queryParams = {
        ...filters,
        ...params,
      };

      const response = await ordersApi.getMyOrders(queryParams);
      
      set({
        myOrders: response.orders || [],
        pagination: {
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 10,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.pages || 0,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Failed to fetch my orders:', {
        message: error?.message,
        statusCode: error?.statusCode,
        error: error?.error,
        fullError: error,
      });
      toast.error('注文履歴の取得に失敗しました');
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

  acceptOrder: async (orderId: string) => {
    try {
      set({ isAccepting: true });
      
      const order = await ordersApi.acceptOrder(orderId);
      
      // Remove from available orders and add to my orders
      const { availableOrders, myOrders } = get();
      set({
        availableOrders: availableOrders.filter(o => o.id !== orderId),
        myOrders: [order, ...myOrders],
        currentOrder: order,
        isAccepting: false,
      });

      toast.success('注文を受け付けました');
    } catch (error: any) {
      set({ isAccepting: false });
      toast.error('注文の受け付けに失敗しました');
      throw error;
    }
  },

  startShopping: async (orderId: string) => {
    try {
      set({ isUpdating: true });
      
      const order = await ordersApi.startShopping(orderId);
      
      // Update in my orders
      const { myOrders, currentOrder } = get();
      const updatedOrders = myOrders.map(o => 
        o.id === orderId ? order : o
      );
      
      set({
        myOrders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? order : currentOrder,
        isUpdating: false,
      });

      toast.success('買い物を開始しました');
    } catch (error: any) {
      set({ isUpdating: false });
      toast.error('ステータス更新に失敗しました');
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: string, data?: any) => {
    try {
      set({ isUpdating: true });
      
      const order = await ordersApi.updateOrderStatus(orderId, status, data);
      
      // Update in my orders
      const { myOrders, currentOrder } = get();
      const updatedOrders = myOrders.map(o => 
        o.id === orderId ? order : o
      );
      
      set({
        myOrders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? order : currentOrder,
        isUpdating: false,
      });

      const statusMessages: Record<string, string> = {
        shopping: '買い物を開始しました',
        enroute: '配送を開始しました',
        delivered: '配送を完了しました',
      };

      toast.success(statusMessages[status] || 'ステータスを更新しました');
    } catch (error: any) {
      set({ isUpdating: false });
      toast.error('ステータス更新に失敗しました');
      throw error;
    }
  },

  submitReceipt: async (orderId: string, receiptImage: File, actualItems: OrderItem[]) => {
    try {
      set({ isUpdating: true });
      
      const order = await ordersApi.submitReceipt(orderId, receiptImage, actualItems);
      
      // Update in my orders
      const { myOrders, currentOrder } = get();
      const updatedOrders = myOrders.map(o => 
        o.id === orderId ? order : o
      );
      
      set({
        myOrders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? order : currentOrder,
        isUpdating: false,
      });

      toast.success('レシートを提出しました');
    } catch (error: any) {
      set({ isUpdating: false });
      toast.error('レシート提出に失敗しました');
      throw error;
    }
  },

  completeDelivery: async (orderId: string, deliveryProof?: File) => {
    try {
      set({ isUpdating: true });
      
      const order = await ordersApi.completeDelivery(orderId, deliveryProof);
      
      // Update in my orders
      const { myOrders, currentOrder } = get();
      const updatedOrders = myOrders.map(o => 
        o.id === orderId ? order : o
      );
      
      set({
        myOrders: updatedOrders,
        currentOrder: currentOrder?.id === orderId ? order : currentOrder,
        isUpdating: false,
      });

      toast.success('配送を完了しました');
    } catch (error: any) {
      set({ isUpdating: false });
      toast.error('配送完了処理に失敗しました');
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
      availableOrders: [],
      myOrders: [],
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

export const canAcceptOrder = (order: Order): boolean => {
  return order.status.toLowerCase() === 'new';
};

export const canStartShopping = (order: Order): boolean => {
  return order.status.toLowerCase() === 'accepted';
};

export const canSubmitReceipt = (order: Order): boolean => {
  return order.status.toLowerCase() === 'shopping';
};

export const canCompleteDelivery = (order: Order): boolean => {
  return order.status.toLowerCase() === 'enroute' && order.receiptStatus === 'approved';
};