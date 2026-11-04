import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GroupBalancesResponse, SettlementPair } from '@/types/api';

export function useGroupBalances(month: string) {
  return useQuery<GroupBalancesResponse>({
    queryKey: ['group-balances', month],
    queryFn: async () => {
      const res = await api.get(`/groups/balances?month=${month}`);
      return res.data;
    },
  });
}

export function useSettleGroup(onSettled?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      month,
      accountId,
      settlements,
    }: {
      groupId: number;
      month: string;
      accountId: number;
      settlements?: SettlementPair[];
    }) => {
      const res = await api.post(`/groups/${groupId}/settle`, {
        month,
        account_id: accountId,
        ...(settlements ? { settlements } : {}),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSettled?.();
    },
  });
}
