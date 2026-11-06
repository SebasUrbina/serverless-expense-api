import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GroupBalancesResponse, GroupSettlement } from '@/types/api';

/**
 * Other members change group data, so it is fetched again when a screen opens
 * or regains focus after 30 s. The user's own changes invalidate it right away.
 */
export const GROUP_STALE_TIME = 30_000;

export function useGroupBalances(month: string) {
  return useQuery<GroupBalancesResponse>({
    queryKey: ['group-balances', month],
    staleTime: GROUP_STALE_TIME,
    queryFn: async () => {
      const res = await api.get(`/groups/balances?month=${month}`);
      return res.data;
    },
  });
}

export function useGroupSettlements(groupId: number, month: string) {
  return useQuery<{ settlements: GroupSettlement[] }>({
    queryKey: ['group-settlements', groupId, month],
    staleTime: GROUP_STALE_TIME,
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
