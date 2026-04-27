'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, parseISO, endOfMonth, isValid } from 'date-fns';
import type {
  TransactionsResponse,
  MonthlySummaryResponse,
  CategorySummaryResponse,
  KpiSummaryResponse,
} from '@/types/api';

export function useDashboardData(filterMonth?: string) {
  const { data: recentTransactions, isLoading: isLoadingRecent } = useQuery<TransactionsResponse>({
    queryKey: ['transactions', 'recent', filterMonth],
    queryFn: async () => {
      let url = '/transactions?limit=15'; // fetch a bit more for a specific month
      
      if (filterMonth) {
        const start = `${filterMonth}-01`;
        const dateObj = parseISO(start);
        if (isValid(dateObj)) {
          const end = format(endOfMonth(dateObj), 'yyyy-MM-dd');
          url += `&startDate=${start}&endDate=${end}`;
        }
      }

      const res = await api.get(url);
      return res.data;
    }
  });

  const { data: monthlySummaryResp, isLoading: isLoadingSummary } = useQuery<MonthlySummaryResponse>({
    queryKey: ['transactions', 'monthlySummary'],
    queryFn: async () => {
      const res = await api.get('/transactions/summary/monthly?months=6');
      return res.data;
    }
  });

  const { data: categorySummaryResp, isLoading: isLoadingCategory } = useQuery<CategorySummaryResponse>({
    queryKey: ['transactions', 'categorySummary', filterMonth],
    queryFn: async () => {
      let url = '/transactions/summary/category?type=expense';
      if (filterMonth) url += `&month=${filterMonth}`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const { data: kpiSummaryResp, isLoading: isLoadingKpi } = useQuery<KpiSummaryResponse>({
    queryKey: ['transactions', 'kpiSummary', filterMonth],
    queryFn: async () => {
      let url = '/transactions/summary/kpi';
      if (filterMonth) url += `?month=${filterMonth}`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const monthlySummary = monthlySummaryResp?.summary || [];
  const categorySummary = categorySummaryResp?.summary || [];
  const kpiSummary = kpiSummaryResp?.kpis || { largest_expense: null, largest_expense_title: null, largest_income: null, transaction_count: 0 };
  
  const selectedMonthSummary = filterMonth
    ? monthlySummary.find(s => s.month === filterMonth)
    : (monthlySummary.length > 0 ? monthlySummary[0] : null);

  // Calculate total balance approximately from the summary 
  // (In a real app, this should probably come from a separate /balances endpoint)
  const totalBalance = filterMonth && selectedMonthSummary
    ? selectedMonthSummary.total_income - selectedMonthSummary.total_expense
    : monthlySummary.reduce((acc, curr) => acc + curr.total_income - curr.total_expense, 0);

  return {
    recentTransactions: recentTransactions?.transactions || [],
    monthlySummary,
    categorySummary,
    kpiSummary,
    selectedMonthSummary,
    totalBalance,
    isLoading: isLoadingRecent || isLoadingSummary || isLoadingCategory || isLoadingKpi
  };
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/transactions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
