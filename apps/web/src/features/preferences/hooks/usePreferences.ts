import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  Category,
  Account,
  UserSetupResponse,
  CategoriesResponse,
  TagsResponse,
  AccountsResponse,
  GroupsResponse,
  ApiKeyResponse,
} from '@/types/api';

export function useCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: queryKeys.preferences.categories,
    staleTime: 10 * 60 * 1000, // 10 minutos
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });
}

export function useTags() {
  return useQuery<TagsResponse>({
    queryKey: queryKeys.preferences.tags,
    staleTime: 10 * 60 * 1000, // 10 minutos
    queryFn: async () => {
      const res = await api.get('/tags');
      return res.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Category, 'id'>) => {
      const res = await api.post('/categories', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      type?: Category['type'];
      icon?: string;
    }) => {
      const res = await api.put(`/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.categories });
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await api.post('/tags', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.tags });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/tags/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.tags });
    },
  });
}

export function useAccounts() {
  return useQuery<AccountsResponse>({
    queryKey: queryKeys.preferences.accounts,
    staleTime: 10 * 60 * 1000, // 10 minutos
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data;
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Account, 'id'>) => {
      const res = await api.post('/accounts', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.accounts });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      type?: Account['type'];
      balance?: number;
    }) => {
      const res = await api.put(`/accounts/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.accounts });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/accounts/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.accounts });
    },
  });
}

export function useUserSetup() {
  const queryClient = useQueryClient();
  return useMutation<UserSetupResponse>({
    mutationFn: async () => {
      const res = await api.post('/user/setup');
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.setup) {
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.accounts });
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.categories });
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.tags });
      }
    },
  });
}

export function useGroups() {
  return useQuery<GroupsResponse>({
    queryKey: queryKeys.preferences.groups,
    staleTime: 5 * 60 * 1000, // 5 minutos
    queryFn: async () => {
      const res = await api.get('/groups');
      return res.data;
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; nickname: string }) => {
      const res = await api.post('/groups', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.groups });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { invite_code: string; nickname: string }) => {
      const res = await api.post('/groups/join', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.groups });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/groups/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.groups });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await api.put(`/groups/${id}`, { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.groups });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupBalances.all });
    },
  });
}

// ── API Keys ──

export function useApiKey() {
  return useQuery<ApiKeyResponse>({
    queryKey: queryKeys.preferences.apiKey,
    staleTime: 10 * 60 * 1000, // 10 minutos
    queryFn: async () => {
      const res = await api.get('/keys');
      return res.data;
    },
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/keys');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.apiKey });
    },
  });
}
