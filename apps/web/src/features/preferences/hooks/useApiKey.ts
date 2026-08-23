import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  generateApiKey,
  getApiKey,
} from '@/features/preferences/api/api-keys';
import { queryKeys } from '@/lib/query-keys';

export function useApiKey() {
  return useQuery({
    queryKey: queryKeys.preferences.apiKey,
    queryFn: getApiKey,
    staleTime: 10 * 60 * 1000,
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.apiKey }),
  });
}
