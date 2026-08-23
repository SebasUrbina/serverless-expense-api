import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setupUser } from '@/features/preferences/api/setup';
import { queryKeys } from '@/lib/query-keys';

export function useUserSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setupUser,
    onSuccess: (data) => {
      if (!data.setup) return;
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.accounts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.categories }),
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.tags }),
      ]);
    },
  });
}
