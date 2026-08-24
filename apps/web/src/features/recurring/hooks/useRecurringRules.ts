'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { RecurringRulesResponse } from '@/types/api';

type ToggleRuleVariables = { id: number; isActive: number };

export function useRecurringRules() {
  const queryClient = useQueryClient();
  const query = useQuery<RecurringRulesResponse>({
    queryKey: queryKeys.recurring.list,
    queryFn: async () => (await api.get('/recurring')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: ToggleRuleVariables) =>
      api.put(`/recurring/${id}`, { is_active: isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring.list });
      const previousData = queryClient.getQueryData<RecurringRulesResponse>(
        queryKeys.recurring.list,
      );

      queryClient.setQueryData<RecurringRulesResponse>(
        queryKeys.recurring.list,
        (current) =>
          current
            ? {
                ...current,
                rules: current.rules.map((rule) =>
                  rule.id === id ? { ...rule, is_active: isActive } : rule,
                ),
              }
            : current,
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.recurring.list,
          context.previousData,
        );
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.list }),
  });

  return {
    ...query,
    rules: query.data?.rules ?? [],
    toggleRule: (id: number, isActive: number) =>
      toggleMutation.mutate({ id, isActive }),
    togglingRuleId: toggleMutation.isPending
      ? toggleMutation.variables?.id
      : undefined,
    toggleError: toggleMutation.error,
  };
}
