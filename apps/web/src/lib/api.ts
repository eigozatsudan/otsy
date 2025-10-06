const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// API response types
export interface ShoppingItem {
  id: string;
  group_id: string;
  name: string;
  category?: string;
  quantity: string;
  note?: string;
  image_url?: string;
  status: 'todo' | 'purchased' | 'cancelled';
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: 'owner' | 'member';
}

export interface CreateShoppingItemRequest {
  name: string;
  category?: string;
  quantity?: string;
  note?: string;
  image_url?: string;
}

export interface UpdateShoppingItemRequest {
  name?: string;
  category?: string;
  quantity?: string;
  note?: string;
  image_url?: string;
  status?: 'todo' | 'purchased' | 'cancelled';
}

export interface UpdateItemStatusRequest {
  status: 'todo' | 'purchased' | 'cancelled';
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface JoinGroupRequest {
  invite_code: string;
}

// API client class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Groups API
  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/groups');
  }

  async getGroup(groupId: string): Promise<Group> {
    return this.request<Group>(`/groups/${groupId}`);
  }

  async createGroup(data: CreateGroupRequest): Promise<Group> {
    return this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinGroup(data: JoinGroupRequest): Promise<Group> {
    return this.request<Group>('/groups/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Shopping Items API
  async getGroupItems(
    groupId: string,
    params?: {
      status?: 'todo' | 'purchased' | 'cancelled';
      category?: string;
      search?: string;
    }
  ): Promise<ShoppingItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    const endpoint = `/groups/${groupId}/items${query ? `?${query}` : ''}`;
    
    return this.request<ShoppingItem[]>(endpoint);
  }

  async getItem(itemId: string): Promise<ShoppingItem> {
    return this.request<ShoppingItem>(`/items/${itemId}`);
  }

  async createItem(groupId: string, data: CreateShoppingItemRequest): Promise<ShoppingItem> {
    return this.request<ShoppingItem>(`/groups/${groupId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(itemId: string, data: UpdateShoppingItemRequest): Promise<ShoppingItem> {
    return this.request<ShoppingItem>(`/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateItemStatus(itemId: string, data: UpdateItemStatusRequest): Promise<ShoppingItem> {
    return this.request<ShoppingItem>(`/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    return this.request<void>(`/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getGroupCategories(groupId: string): Promise<string[]> {
    return this.request<string[]>(`/groups/${groupId}/items/categories`);
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Helper function to set auth token
export const setAuthToken = (token: string) => {
  apiClient.setToken(token);
};

// Initialize auth token from localStorage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
    apiClient.setToken(token);
  }
}