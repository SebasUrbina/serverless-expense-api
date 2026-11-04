import type { QueryClient } from '@tanstack/react-query';

/**
 * Creating a movement works offline: the mutation pauses, is persisted with
 * the query cache and is sent when the connection returns. Its function lives
 * in the defaults so a mutation restored after a reload can still run.
 */
export const CREATE_TRANSACTION_KEY = ['transactions', 'create'] as const;

export type CreateTransactionVariables = {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  [key: string]: unknown;
};

export function registerOfflineMutations(
  queryClient: QueryClient,
  createTransaction: (payload: CreateTransactionVariables) => Promise<unknown>,
) {
  queryClient.setMutationDefaults(CREATE_TRANSACTION_KEY, {
    mutationFn: createTransaction,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
