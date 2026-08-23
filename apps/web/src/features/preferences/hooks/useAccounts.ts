import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAccount,
  deleteAccount,
  getAccounts,
  updateAccount,
} from '@/features/preferences/api/accounts';
import { queryKeys } from '@/lib/query-keys';

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.preferences.accounts,
    queryFn: getAccounts,
    staleTime: 10 * 60 * 1000,
  });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.preferences.accounts });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: createAccount,
    onSuccess: useInvalidateAccounts(),
  });
}

export function useUpdateAccount() {
  return useMutation({
    mutationFn: updateAccount,
    onSuccess: useInvalidateAccounts(),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: useInvalidateAccounts(),
  });
}
