'use client';

import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, parseISO } from 'date-fns';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  CategorySummary,
  CategoryTrendResponse,
  MonthlySummary,
} from '@/types/api';

type SummaryResponse<T> = { summary: T[] };

export function useAnalyticsData(month: string) {
  const monthly = useQuery<SummaryResponse<MonthlySummary>>({
    queryKey: queryKeys.transactions.analytics.monthly(month),
    queryFn: async () => {
      const selectedMonth = parseISO(`${month}-01`);
      const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      const response = await api.get(
        `/transactions/summary/monthly?months=12&endDate=${endDate}`,
      );
      return response.data;
    },
  });

  const categories = useQuery<SummaryResponse<CategorySummary>>({
    queryKey: queryKeys.transactions.analytics.category(month),
    queryFn: async () => {
      const response = await api.get(
        `/transactions/summary/category?type=expense&month=${month}`,
      );
      return response.data;
    },
  });

  const trend = useQuery<CategoryTrendResponse>({
    queryKey: queryKeys.transactions.analytics.categoryTrend,
    queryFn: async () => {
      const response = await api.get(
        '/transactions/summary/category-trend?months=12',
      );
      return response.data;
    },
  });

  return {
    monthlySummary: monthly.data?.summary ?? [],
    categorySummary: categories.data?.summary ?? [],
    trend: trend.data,
    isLoadingTrend: trend.isLoading,
    isLoading: monthly.isLoading || categories.isLoading || trend.isLoading,
  };
}
