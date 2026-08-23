import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGroup,
  deleteGroup,
  getGroups,
  joinGroup,
  updateGroup,
} from '@/features/preferences/api/groups';
import { queryKeys } from '@/lib/query-keys';

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.preferences.groups,
    queryFn: getGroups,
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.preferences.groups });
}

export function useCreateGroup() {
  return useMutation({ mutationFn: createGroup, onSuccess: useInvalidateGroups() });
}

export function useJoinGroup() {
  return useMutation({ mutationFn: joinGroup, onSuccess: useInvalidateGroups() });
}

export function useDeleteGroup() {
  return useMutation({ mutationFn: deleteGroup, onSuccess: useInvalidateGroups() });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGroup,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.preferences.groups }),
        queryClient.invalidateQueries({ queryKey: queryKeys.groupBalances.all }),
      ]),
  });
}
