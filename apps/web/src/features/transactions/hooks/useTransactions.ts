'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { endOfMonth, format, isValid, parseISO } from 'date-fns';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { TransactionsResponse } from '@/types/api';
import type { TransactionFilters } from '@/features/transactions/model/transaction-filters';

function buildTransactionSearchParams(
  filters: TransactionFilters,
  page: number,
) {
  const params = new URLSearchParams({ limit: '30', page: String(page) });

  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId !== '') {
    params.set('category_id', String(filters.categoryId));
  }
  if (filters.tagId !== '') params.set('tag_id', String(filters.tagId));
  if (filters.shared) params.set('is_shared', '1');
  if (filters.groupId !== '') params.set('group_id', String(filters.groupId));

  if (filters.month) {
    const start = `${filters.month}-01`;
    const date = parseISO(start);
    if (isValid(date)) {
      params.set('startDate', start);
      params.set('endDate', format(endOfMonth(date), 'yyyy-MM-dd'));
    }
  }

  return params;
}

export function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery<TransactionsResponse>({
    queryKey: queryKeys.transactions.list([
      filters.search,
      filters.month,
      filters.categoryId,
      filters.tagId,
      filters.shared,
      filters.groupId,
    ]),
    queryFn: async ({ pageParam }) => {
      const params = buildTransactionSearchParams(filters, Number(pageParam));
      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
}
