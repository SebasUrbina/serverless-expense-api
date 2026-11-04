import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GroupBalancesResponse, GroupSettlement } from '@/types/api';

export function useGroupBalances(month: string) {
  return useQuery<GroupBalancesResponse>({
    queryKey: ['group-balances', month],
    queryFn: async () => {
      const res = await api.get(`/groups/balances?month=${month}`);
      return res.data;
    },
  });
}

export function useGroupSettlements(groupId: number, month: string) {
  return useQuery<{ settlements: GroupSettlement[] }>({
    queryKey: ['group-settlements', groupId, month],
    queryFn: async () => {
      const res = await api.get(
        `/groups/${groupId}/settlements?month=${month}`,
      );
      return res.data;
    },
  });
}

function useInvalidateSettlements() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['group-balances'] });
    queryClient.invalidateQueries({ queryKey: ['group-settlements'] });
  };
}

export function useCreateSettlement(onCreated?: () => void) {
  const invalidate = useInvalidateSettlements();
  return useMutation({
    mutationFn: async ({
      groupId,
      ...body
    }: {
      groupId: number;
      from_user_id: string;
      to_user_id: string;
      amount: number;
    }) => (await api.post(`/groups/${groupId}/settlements`, body)).data,
    onSuccess: () => {
      invalidate();
      onCreated?.();
    },
  });
}

export function useDeleteSettlement() {
  const invalidate = useInvalidateSettlements();
  return useMutation({
    mutationFn: async ({ groupId, id }: { groupId: number; id: number }) =>
      (await api.delete(`/groups/${groupId}/settlements/${id}`)).data,
    onSuccess: invalidate,
  });
}
