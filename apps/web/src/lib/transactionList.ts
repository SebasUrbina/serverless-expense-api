import { infiniteQueryOptions } from '@tanstack/react-query';
import { endOfMonth, format, isValid, parseISO } from 'date-fns';
import type { Transaction } from '../types/api';

export interface TransactionFilters {
  search: string;
  month: string;
  category: number | '';
  tag: number | '';
  shared: boolean;
  group: number | '';
}

export interface TransactionPage {
  transactions: Transaction[];
  hasMore: boolean;
  nextPage: number | null;
}

export function transactionListOptions(
  filters: TransactionFilters,
  fetchPage: (url: string, signal: AbortSignal) => Promise<TransactionPage>,
) {
  return infiniteQueryOptions({
    // Separate from the persisted single-page cache used by older clients.
    queryKey: ['transactions', 'infinite-list', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({
        limit: '50',
        page: String(pageParam),
      });
      if (filters.search) params.set('search', filters.search);
      if (filters.category !== '')
        params.set('category_id', String(filters.category));
      if (filters.tag !== '') params.set('tag_id', String(filters.tag));
      if (filters.shared) params.set('is_shared', '1');
      if (filters.group !== '') params.set('group_id', String(filters.group));
      if (filters.month) {
        const start = `${filters.month}-01`;
        const date = parseISO(start);
        if (isValid(date)) {
          params.set('startDate', start);
          params.set('endDate', format(endOfMonth(date), 'yyyy-MM-dd'));
        }
      }
      return fetchPage(`/transactions?${params}`, signal);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextPage ?? undefined) : undefined,
  });
}
