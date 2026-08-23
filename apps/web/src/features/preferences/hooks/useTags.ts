import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTag, deleteTag, getTags } from '@/features/preferences/api/tags';
import { queryKeys } from '@/lib/query-keys';

export function useTags() {
  return useQuery({
    queryKey: queryKeys.preferences.tags,
    queryFn: getTags,
    staleTime: 10 * 60 * 1000,
  });
}

function useInvalidateTags() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.preferences.tags });
}

export function useCreateTag() {
  return useMutation({ mutationFn: createTag, onSuccess: useInvalidateTags() });
}

export function useDeleteTag() {
  return useMutation({ mutationFn: deleteTag, onSuccess: useInvalidateTags() });
}
