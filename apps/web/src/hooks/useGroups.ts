import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient, Group, CreateGroupRequest, JoinGroupRequest } from '@/lib/api';
import toast from 'react-hot-toast';

// Query keys
export const GROUP_QUERY_KEYS = {
  groups: ['groups'],
  group: (id: string) => ['groups', id],
};

// Get user groups
export const useGroups = () => {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.groups,
    queryFn: () => apiClient.getGroups(),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get single group
export const useGroup = (groupId: string) => {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.group(groupId),
    queryFn: () => apiClient.getGroup(groupId),
    enabled: !!groupId,
  });
};

// Create group
export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupRequest) => apiClient.createGroup(data),
    onSuccess: () => {
      // Invalidate and refetch groups
      queryClient.invalidateQueries(GROUP_QUERY_KEYS.groups);
      toast.success('グループを作成しました！');
    },
    onError: (error: Error) => {
      toast.error(`グループの作成に失敗しました: ${error.message}`);
    },
  });
};

// Join group
export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinGroupRequest) => apiClient.joinGroup(data),
    onSuccess: () => {
      // Invalidate and refetch groups
      queryClient.invalidateQueries(GROUP_QUERY_KEYS.groups);
      toast.success('グループに参加しました！');
    },
    onError: (error: Error) => {
      toast.error(`グループへの参加に失敗しました: ${error.message}`);
    },
  });
};