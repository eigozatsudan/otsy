import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  apiClient, 
  ShoppingItem, 
  CreateShoppingItemRequest, 
  UpdateShoppingItemRequest,
  UpdateItemStatusRequest 
} from '@/lib/api';
import toast from 'react-hot-toast';

// Query keys
export const QUERY_KEYS = {
  groups: ['groups'],
  group: (id: string) => ['groups', id],
  groupItems: (groupId: string, params?: any) => ['groups', groupId, 'items', params],
  item: (id: string) => ['items', id],
  groupCategories: (groupId: string) => ['groups', groupId, 'categories'],
};

// Get group items
export const useGroupItems = (
  groupId: string,
  params?: {
    status?: 'todo' | 'purchased' | 'cancelled';
    category?: string;
    search?: string;
  }
) => {
  return useQuery({
    queryKey: QUERY_KEYS.groupItems(groupId, params),
    queryFn: () => apiClient.getGroupItems(groupId, params),
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get single item
export const useItem = (itemId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.item(itemId),
    queryFn: () => apiClient.getItem(itemId),
    enabled: !!itemId,
  });
};

// Create item
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateShoppingItemRequest }) =>
      apiClient.createItem(groupId, data),
    onSuccess: (newItem) => {
      // Invalidate and refetch group items
      queryClient.invalidateQueries(['groups', newItem.group_id, 'items']);
      toast.success('アイテムを追加しました！');
    },
    onError: (error: Error) => {
      toast.error(`アイテムの追加に失敗しました: ${error.message}`);
    },
  });
};

// Update item
export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateShoppingItemRequest }) =>
      apiClient.updateItem(itemId, data),
    onSuccess: (updatedItem) => {
      // Update the item in cache
      queryClient.setQueryData(QUERY_KEYS.item(updatedItem.id), updatedItem);
      // Invalidate group items to refresh the list
      queryClient.invalidateQueries(['groups', updatedItem.group_id, 'items']);
      toast.success('アイテムを更新しました！');
    },
    onError: (error: Error) => {
      toast.error(`アイテムの更新に失敗しました: ${error.message}`);
    },
  });
};

// Update item status
export const useUpdateItemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateItemStatusRequest }) =>
      apiClient.updateItemStatus(itemId, data),
    onSuccess: (updatedItem) => {
      // Update the item in cache
      queryClient.setQueryData(QUERY_KEYS.item(updatedItem.id), updatedItem);
      // Invalidate group items to refresh the list
      queryClient.invalidateQueries(['groups', updatedItem.group_id, 'items']);
      
      const statusLabels = {
        todo: '購入予定',
        purchased: '購入済み',
        cancelled: 'キャンセル',
      };
      toast.success(`ステータスを「${statusLabels[updatedItem.status]}」に変更しました`);
    },
    onError: (error: Error) => {
      toast.error(`ステータスの更新に失敗しました: ${error.message}`);
    },
  });
};

// Delete item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => apiClient.deleteItem(itemId),
    onSuccess: (_, itemId) => {
      // Remove the item from cache
      queryClient.removeQueries(QUERY_KEYS.item(itemId));
      // Invalidate all group items queries to refresh lists
      queryClient.invalidateQueries(['groups']);
      toast.success('アイテムを削除しました');
    },
    onError: (error: Error) => {
      toast.error(`アイテムの削除に失敗しました: ${error.message}`);
    },
  });
};

// Get group categories
export const useGroupCategories = (groupId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.groupCategories(groupId),
    queryFn: () => apiClient.getGroupCategories(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};