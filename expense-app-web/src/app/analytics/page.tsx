'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, Cell } from 'recharts';
import { format, parseISO, isValid, addMonths } from 'date-fns';
import { MonthlySummary, CategorySummary } from '@/hooks/useDashboardData';
import { useState } from 'react';
import { MonthSelector } from '@/components/MonthSelector';
import { ArrowUpRight, ArrowDownRight, TrendingUp, User } from 'lucide-react';
import { formatCompactValue } from '@/lib/utils';
import Link from 'next/link';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl min-w-[140px]">
        <p className="text-zinc-400 text-sm font-medium mb-3 border-b border-zinc-800 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            let color = entry.color;
            if (entry.name === 'Income') color = '#30D158';
            if (entry.name === 'Expense') color = '#FF453A';
            return (
              <div key={index} className="flex items-center justify-between gap-6">
                <span className="text-sm font-medium" style={{ color }}>{entry.name}</span>
                <span className="text-sm font-bold" style={{ color }}>${Number(entry.value).toLocaleString('es-CL')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: response, isLoading: isLoadingSummary } = useQuery<{ summary: MonthlySummary[] }>({
    queryKey: ['transactions', 'analytics', 'monthly', filterMonth],
    queryFn: async () => {
      let url = '/transactions/summary/monthly?months=12';
      if (filterMonth) url += `&endDate=${filterMonth}-31`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const { data: categoryResponse, isLoading: isLoadingCategory } = useQuery<{ summary: CategorySummary[] }>({
    queryKey: ['transactions', 'analytics', 'category', filterMonth],
    queryFn: async () => {
      let url = '/transactions/summary/category?type=expense';
      if (filterMonth) url += `&month=${filterMonth}`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const isLoading = isLoadingSummary || isLoadingCategory;
  const monthlySummary = response?.summary || [];
  const categorySummary = categoryResponse?.summary || [];

  const chartData = monthlySummary
    .filter((item) => item.month)
    .map((item) => {
      const parsedDate = parseISO(`${item.month}-01`);
      return {
        name: isValid(parsedDate) ? format(parsedDate, 'MMM') : item.month,
        Income: item.total_income,
        Expense: item.total_expense,
        Balance: item.total_income - item.total_expense
      };
    });

  const savingsData = chartData.map(d => ({
    name: d.name,
    Savings: d.Balance,
    isProjection: false
  }));

  if (!filterMonth && chartData.length > 0) {
    const recentMonths = chartData.slice(-3);
    const avgSavings = recentMonths.reduce((sum, item) => sum + item.Balance, 0) / recentMonths.length;
    const lastMonthRaw = monthlySummary.filter(m => m.month).pop()?.month;
    if (lastMonthRaw) {
      const lastDate = parseISO(`${lastMonthRaw}-01`);
      if (isValid(lastDate)) {
        const nextDate = addMonths(lastDate, 1);
        savingsData.push({ name: format(nextDate, 'MMM') + ' (Est)', Savings: avgSavings, isProjection: true });
      }
    }
  }

  const totalExpense = categorySummary.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Analytics</h1>
            <p className="text-zinc-500 text-sm mt-0.5 hidden sm:block">Your financial trajectory at a glance.</p>
          </div>
          <div className="shrink-0 relative z-20 flex items-center gap-2">
            <MonthSelector value={filterMonth} onChange={setFilterMonth} />
            <Link
              href="/settings"
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white sm:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
              aria-label="Settings"
            >
              <User size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-4">

        {/* Row 1: Cashflow Chart + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

          {/* Area Chart */}
          <div className="lg:col-span-2 xl:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col min-h-[320px] sm:min-h-[420px]">
            <p className="text-white font-bold text-base mb-4">Annual Cashflow Overlay</p>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#30D158" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF453A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF453A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactValue} width={60} />
                    <Tooltip cursor={{ fill: '#27272a', opacity: 0.4 }} content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="Income" stroke="#30D158" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="Expense" stroke="#FF453A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">Not enough data yet.</div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="lg:col-span-1 xl:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[320px] sm:h-[420px]">
            <p className="text-white font-bold text-base mb-4">Spending by Category</p>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
              </div>
            ) : categorySummary.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {categorySummary.map((cat, idx) => {
                  const percentage = ((cat.amount / totalExpense) * 100).toFixed(1);
                  const delta = cat.previous_amount !== undefined ? cat.amount - cat.previous_amount! : 0;
                  const isIncrease = delta > 0;

                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-white text-sm font-medium flex items-center gap-1.5">
                          {cat.category_icon && <span>{cat.category_icon}</span>}
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2">
                          {delta !== 0 && cat.previous_amount !== undefined && (
                            <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isIncrease ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {isIncrease ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
                              ${Math.abs(delta).toLocaleString('es-CL')}
                            </span>
                          )}
                          <span className="text-zinc-300 text-sm font-semibold">${cat.amount.toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-500 w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">No category data.</div>
            )}
          </div>
        </div>

        {/* Row 2: Savings & Projections */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[280px] sm:h-[360px]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-400" />
            <p className="text-white font-bold text-base">Monthly Savings &amp; Projections</p>
          </div>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
            </div>
          ) : savingsData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactValue} width={60} />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `$${Number(value).toLocaleString('es-CL')}`,
                      props.payload.isProjection ? 'Projected Savings' : 'Savings'
                    ]}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                  />
                  <Bar dataKey="Savings" radius={[4, 4, 0, 0]} name="Savings">
                    {savingsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.Savings >= 0 ? '#30D158' : '#FF453A'}
                        fillOpacity={entry.isProjection ? 0.3 : 1}
                        stroke={entry.isProjection ? (entry.Savings >= 0 ? '#30D158' : '#FF453A') : 'none'}
                        strokeDasharray={entry.isProjection ? '4 4' : 'none'}
                        strokeWidth={entry.isProjection ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">No savings data available.</div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
