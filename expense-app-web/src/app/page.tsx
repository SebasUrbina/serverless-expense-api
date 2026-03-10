'use client';

import { useDashboardData, Transaction } from '@/hooks/useDashboardData';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, CreditCard, PieChart as PieChartIcon, TrendingUp, TrendingDown, Target, User } from 'lucide-react';
import { MonthSelector } from '@/components/MonthSelector';
import { SharedBalancesCard } from '@/components/SharedBalancesCard';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCompactValue } from '@/lib/utils';
import { useTransactionModal } from '@/store/useTransactionModal';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl min-w-[140px]">
        <p className="text-zinc-400 text-sm font-medium mb-3 border-b border-zinc-800 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            let color = entry.color;
            if (entry.name === 'Savings') color = '#a855f7';
            return (
              <div key={index} className="flex items-center justify-between gap-6">
                <span className="text-sm font-medium" style={{ color }}>{entry.name}</span>
                <span className="text-sm font-bold" style={{ color }}>{formatCompactValue(Number(entry.value))}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const router = useRouter();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { recentTransactions, monthlySummary, categorySummary, kpiSummary, selectedMonthSummary, totalBalance, isLoading } = useDashboardData(filterMonth);
  const { openModal } = useTransactionModal();

  const chartData = monthlySummary
    .filter((item) => item.month)
    .map((item) => {
      const parsedDate = parseISO(`${item.month}-01`);
      return {
        name: isValid(parsedDate) ? format(parsedDate, 'MMM') : item.month,
        Income: item.total_income,
        Expense: item.total_expense,
        Savings: item.total_income - item.total_expense,
        originalMonth: item.month,
      };
    });

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5 hidden sm:block">Your financial overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <MonthSelector value={filterMonth} onChange={setFilterMonth} />
            <Link
              href="/settings"
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white sm:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
              aria-label="Settings"
            >
              <User size={18} />
            </Link>
            <button
              onClick={() => openModal()}
              className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-3.5 py-2.5 rounded-xl font-semibold transition-colors items-center gap-1.5 shadow-lg shadow-emerald-500/20 text-sm whitespace-nowrap"
            >
              <span className="text-base leading-none">+</span>
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
          </div>
        ) : (
          <>
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Balance */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wallet size={80} />
                </div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Balance</p>
                <p className="text-white text-3xl sm:text-4xl font-bold">${totalBalance.toLocaleString('es-CL')}</p>
              </div>

              {/* Monthly Expenses */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5 opacity-5 text-red-500 group-hover:opacity-10 transition-opacity">
                  <ArrowDownRight size={80} />
                </div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Expenses</p>
                <p className="text-white text-3xl sm:text-4xl font-bold">${selectedMonthSummary?.total_expense.toLocaleString('es-CL') || '0'}</p>
              </div>

              {/* Monthly Income */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5 opacity-5 text-emerald-500 group-hover:opacity-10 transition-opacity">
                  <ArrowUpRight size={80} />
                </div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Income</p>
                <p className="text-emerald-400 text-3xl sm:text-4xl font-bold">${selectedMonthSummary?.total_income.toLocaleString('es-CL') || '0'}</p>
              </div>

              {/* Transactions Count */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5 opacity-5 text-emerald-500 group-hover:opacity-10 transition-opacity">
                  <CreditCard size={80} />
                </div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Transactions</p>
                <p className="text-white text-3xl sm:text-4xl font-bold">{kpiSummary?.transaction_count || 0}</p>
              </div>
            </div>

            {/* Shared Balances */}
            <SharedBalancesCard filterMonth={filterMonth} />

            {/* Chart + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Cashflow Chart */}
              <div className="lg:col-span-2 xl:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col min-h-[320px] sm:min-h-[400px]">
                <p className="text-white font-bold text-base mb-4">Cashflow Trend</p>
                {chartData.length > 0 ? (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactValue} width={50} />
                        <Tooltip cursor={{ fill: '#27272a', opacity: 0.4 }} content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                        <Bar dataKey="Income" fill="#30D158" radius={[4, 4, 0, 0]}
                          onClick={(data: any) => { if (data?.originalMonth) router.push(`/transactions?month=${data.originalMonth}`); }}
                          cursor="pointer"
                        >
                          <LabelList dataKey="Income" position="top" fill="#a1a1aa" fontSize={9} formatter={(val: any) => val ? formatCompactValue(Number(val)) : ''} />
                        </Bar>
                        <Bar dataKey="Expense" fill="#FF453A" radius={[4, 4, 0, 0]}
                          onClick={(data: any) => { if (data?.originalMonth) router.push(`/transactions?month=${data.originalMonth}`); }}
                          cursor="pointer"
                        >
                          <LabelList dataKey="Expense" position="top" fill="#a1a1aa" fontSize={9} formatter={(val: any) => val ? formatCompactValue(Number(val)) : ''} />
                        </Bar>
                        <Line type="monotone" dataKey="Savings" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#c084fc' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">No data available yet.</div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-1 xl:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[320px] sm:h-[400px]">
                <div className="flex justify-between items-center mb-5">
                  <p className="text-white font-bold text-lg">Recent</p>
                  <Link href="/transactions" className="text-emerald-500 text-sm font-semibold hover:text-emerald-400 transition-colors">View all →</Link>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 -mx-2 px-2">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`flex justify-between items-center p-2 rounded-xl transition-colors ${tx.is_owner !== false ? 'cursor-pointer hover:bg-zinc-800/50' : 'cursor-default'}`}
                        onClick={() => {
                          if (tx.is_owner === false) return;
                          openModal(tx);
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.category_icon || (tx.type === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{tx.title}</p>
                            <p className="text-zinc-500 text-xs">{tx.category} · {format(parseISO(tx.date), 'MMM d')}</p>
                          </div>
                        </div>
                        <p className={`shrink-0 font-bold text-sm ml-2 ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.type === 'income' ? '+' : '−'}${tx.amount.toLocaleString('es-CL')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                      <Receipt className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">No transactions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Categories + KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Top Spending Categories */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col min-h-[260px]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="text-emerald-500" size={20} />
                    <p className="text-white font-bold text-lg">Top Categories</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                  {categorySummary && categorySummary.length > 0 ? (
                    categorySummary.map((cat, idx) => {
                      const delta = cat.previous_amount !== undefined ? cat.amount - cat.previous_amount! : 0;
                      const isIncrease = delta > 0;
                      const isDecrease = delta < 0;
                      return (
                        <div
                          key={idx}
                          className="bg-zinc-800/30 rounded-xl p-3 flex justify-between items-center border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          onClick={() => {
                            let url = `/transactions?category_id=${cat.category_id}`;
                            if (filterMonth) url += `&month=${filterMonth}`;
                            router.push(url);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                              {cat.category_icon ? <span className="text-lg">{cat.category_icon}</span> : <Target size={16} className="text-zinc-400" />}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{cat.category}</p>
                              {cat.previous_amount !== undefined && delta !== 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isIncrease ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {isIncrease ? <ArrowUpRight size={9} className="mr-0.5" /> : <ArrowDownRight size={9} className="mr-0.5" />}
                                    ${Math.abs(delta).toLocaleString('es-CL')}
                                  </span>
                                  <span className="text-zinc-600 text-[10px]">vs last month</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-red-400 font-bold text-sm">${cat.amount.toLocaleString('es-CL')}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm py-8 sm:col-span-2">No category data yet.</div>
                  )}
                  </div>
                </div>
              </div>

              {/* Extreme KPIs */}
              <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group hover:bg-zinc-800/50 transition-colors flex-1">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                      <TrendingDown size={24} />
                    </div>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Largest Expense</p>
                    <p className="text-white font-medium text-sm mt-1 truncate" title={kpiSummary?.largest_expense_title || ''}>
                      {kpiSummary?.largest_expense_title || 'N/A'}
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-red-500 mt-4">${kpiSummary?.largest_expense?.toLocaleString('es-CL') || '0'}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group hover:bg-zinc-800/50 transition-colors flex-1">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Largest Income</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-400 mt-4">${kpiSummary?.largest_income?.toLocaleString('es-CL') || '0'}</p>
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
