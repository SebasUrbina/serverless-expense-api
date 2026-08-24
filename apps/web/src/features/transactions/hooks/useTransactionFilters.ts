'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  emptyTransactionFilters,
  parseTransactionFilters,
  serializeTransactionFilters,
  type TransactionFilters,
} from '@/features/transactions/model/transaction-filters';

export function useTransactionFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseTransactionFilters(searchParams),
    [searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<TransactionFilters>) => {
      const nextFilters = { ...filters, ...patch };
      if (!nextFilters.shared) nextFilters.groupId = '';

      const nextParams = serializeTransactionFilters(nextFilters, searchParams);
      const query = nextParams.toString();
      if (query === searchParams.toString()) return;

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    const nextParams = serializeTransactionFilters(
      emptyTransactionFilters,
      searchParams,
    );
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  return { filters, setFilters, clearFilters };
}
