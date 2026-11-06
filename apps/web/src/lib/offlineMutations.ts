import type { QueryClient } from '@tanstack/react-query';

/**
 * Creating, editing and deleting movements work offline: the mutation pauses,
 * is persisted with the query cache and is sent when the connection returns.
 * Their functions live in the defaults so mutations restored after a reload
 * can still run, and they share a scope so they are sent in order.
 */
export const CREATE_TRANSACTION_KEY = ['transactions', 'create'] as const;
export const UPDATE_TRANSACTION_KEY = ['transactions', 'update'] as const;
export const DELETE_TRANSACTION_KEY = ['transactions', 'delete'] as const;
const SCOPE = { id: 'transactions' };

export type CreateTransactionVariables = {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  /** Lets the API recognize a retried create; see migration 0005. */
  client_id: string;
  [key: string]: unknown;
};

export type UpdateTransactionVariables = {
  id: number;
  payload: Record<string, unknown> & { title: string };
};

/** What lists and totals need to hide a movement that is being deleted. */
export type DeletedTransaction = {
  id: number;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  category_id: number | null;
};

export type TransactionApi = {
  create: (payload: CreateTransactionVariables) => Promise<unknown>;
  update: (id: number, payload: Record<string, unknown>) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
};

export function registerOfflineMutations(
  queryClient: QueryClient,
  transactions: TransactionApi,
) {
  // Shared movements also move group balances and the group ledger.
  const onSettled = () =>
    Promise.all(
      [['transactions'], ['group-balances'], ['group-settlements']].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    );
  queryClient.setMutationDefaults(CREATE_TRANSACTION_KEY, {
    mutationFn: transactions.create,
    scope: SCOPE,
    onSettled,
  });
  queryClient.setMutationDefaults(UPDATE_TRANSACTION_KEY, {
    mutationFn: ({ id, payload }: UpdateTransactionVariables) =>
      transactions.update(id, payload),
    scope: SCOPE,
    onSettled,
  });
  queryClient.setMutationDefaults(DELETE_TRANSACTION_KEY, {
    mutationFn: ({ id }: DeletedTransaction) => transactions.remove(id),
    scope: SCOPE,
    onSettled,
  });
}

/** Runs a mutation registered above outside of a component. */
export function runTransactionMutation<V>(
  queryClient: QueryClient,
  mutationKey: readonly unknown[],
  variables: V,
) {
  return queryClient
    .getMutationCache()
    .build<unknown, Error, V, unknown>(queryClient, { mutationKey })
    .execute(variables);
}

type TransactionLike = { id: number } & Record<string, unknown>;
type CachedList =
  | { transactions?: TransactionLike[] }
  | { pages?: { transactions?: TransactionLike[] }[] };

/**
 * Applies `patch` to a movement wherever it is cached (paged list, recent
 * list, category detail) so an edit shows before it reaches the server.
 */
export function patchCachedTransaction(
  queryClient: QueryClient,
  id: number,
  patch: Record<string, unknown>,
) {
  const apply = (list?: TransactionLike[]) =>
    list?.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx));
  queryClient.setQueriesData<CachedList>(
    { queryKey: ['transactions'] },
    (old) => {
      if (!old || typeof old !== 'object') return old;
      if ('pages' in old && Array.isArray(old.pages)) {
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            transactions: apply(page.transactions),
          })),
        };
      }
      if ('transactions' in old && Array.isArray(old.transactions)) {
        return { ...old, transactions: apply(old.transactions) };
      }
      return old;
    },
  );
}
