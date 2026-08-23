import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/features/preferences/api/categories';
import { queryKeys } from '@/lib/query-keys';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.preferences.categories,
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.preferences.categories,
    });
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: createCategory,
    onSuccess: useInvalidateCategories(),
  });
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: useInvalidateCategories(),
  });
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: useInvalidateCategories(),
  });
}
