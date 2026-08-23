'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { BudgetsResponse } from '@/types/api';

export function useBudget(month: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BudgetsResponse>({
    queryKey: queryKeys.budgets.byMonth(month),
    queryFn: async () => {
      const res = await api.get(`/budgets?month=${month}`);
      return res.data;
    },
  });

  const budgets = data?.budgets || [];
  const general = budgets.find((b) => b.scope === 'general') ?? null;

  const saveBudget = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.put('/budgets', {
        month,
        scope: 'general',
        category_id: null,
        amount,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.byMonth(month),
      });
    },
  });

  return { budgets, general, isLoading, saveBudget };
}
