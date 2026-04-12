'use client';

import { useDashboardData, Transaction } from '@/hooks/useDashboardData';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import { format, parseISO, isValid, subMonths } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, CreditCard, PieChart as PieChartIcon, TrendingUp, TrendingDown, Target, Settings } from 'lucide-react';
import { MonthSelector } from '@/components/MonthSelector';
import { SharedBalancesCard } from '@/components/SharedBalancesCard';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCompactValue, formatCurrency } from '@/lib/utils';
import { useTransactionModal } from '@/store/useTransactionModal';
import { useAuth } from '@/lib/AuthProvider';


export default function Home() {
  const router = useRouter();
  const { session } = useAuth();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { recentTransactions, monthlySummary, categorySummary, kpiSummary, selectedMonthSummary, totalBalance, isLoading } = useDashboardData(filterMonth);
  const { openModal } = useTransactionModal();

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] || null;

  const expense = filterMonth ? (selectedMonthSummary?.total_expense ?? 0) : monthlySummary.reduce((acc, curr) => acc + curr.total_expense, 0);
  const income = filterMonth ? (selectedMonthSummary?.total_income ?? 0) : monthlySummary.reduce((acc, curr) => acc + curr.total_income, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const previousMonthDate = subMonths(parseISO(`${filterMonth}-01`), 1);
  const previousMonthStr = isValid(previousMonthDate) ? format(previousMonthDate, 'yyyy-MM') : null;
  const previousMonthSummary = monthlySummary.find(s => s.month === previousMonthStr);
  const prevExpense = previousMonthSummary?.total_expense ?? 0;
  
  let expenseDeltaRaw = 0;
  if (prevExpense > 0) {
    expenseDeltaRaw = ((expense - prevExpense) / prevExpense) * 100;
  } else if (expense > 0) {
    expenseDeltaRaw = 100;
  }
  const isExpenseIncrease = expenseDeltaRaw > 0;
  const isExpenseDecrease = expenseDeltaRaw < 0;
  const absExpenseDelta = Math.abs(expenseDeltaRaw).toFixed(0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {firstName ? `Hola, ${firstName} 👋` : 'Mi resumen 👋'}
            </h1>
            <p className="text-sm mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              Aquí puedes ver en que Seva tu dinero.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MonthSelector value={filterMonth} onChange={setFilterMonth} />
            <Link
              href="/settings"
              className="sm:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              aria-label="Ajustes"
            >
              <Settings size={18} />
            </Link>
            <button
              onClick={() => openModal()}
              className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-3.5 py-2.5 rounded-xl font-semibold transition-colors items-center gap-1.5 shadow-lg shadow-emerald-500/20 text-sm whitespace-nowrap"
            >
              <span className="text-base leading-none">+</span>
              <span>Añadir</span>
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
              {/* Massive Centered Expense Hero */}
              <div className="flex flex-col items-center justify-center py-6 sm:py-10 mb-2 relative">
                
                {/* Link to Analytics */}
                <Link 
                  href={`/analytics?month=${filterMonth}`}
                  className="absolute top-0 right-0 hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <PieChartIcon size={12} />
                  Ver desglose detallado
                </Link>

                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {filterMonth ? 'Este mes has gastado' : 'Gasto Total'}
                </p>
                <div className="flex items-baseline gap-1 leading-none mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push(`/analytics?month=${filterMonth}`)}>
                  <span className="text-3xl sm:text-4xl font-medium mb-1" style={{ color: 'var(--text-muted)' }}>$</span>
                  <h2 className="text-6xl sm:text-7xl font-extrabold tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(expense)}
                  </h2>
                </div>
                
                {/* vs previous month indicator */}
                {filterMonth && prevExpense > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
                     <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>vs mes pasado</span>
                     <span className={`text-xs font-bold flex items-center gap-1 ${isExpenseIncrease ? 'text-red-500' : isExpenseDecrease ? 'text-emerald-500' : 'text-gray-500'}`}>
                       {isExpenseIncrease ? `+${absExpenseDelta}%` : isExpenseDecrease ? `-${absExpenseDelta}%` : `0%`}
                     </span>
                  </div>
                )}
                
                {/* Minimalist Flow & Meta Row */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 mt-6 sm:mt-10">
                  <div className="flex flex-col items-center">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Wallet size={10} className="sm:w-3 sm:h-3" style={{ color: 'var(--color-balance)' }} /> Balance Total
                    </p>
                    <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-balance)' }}>${formatCurrency(totalBalance)}</p>
                  </div>
                  
                  <div className="w-px h-6 sm:h-8" style={{ background: 'var(--border)' }} />
                  
                  <div className="flex flex-col items-center">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <ArrowUpRight size={10} className="sm:w-3 sm:h-3" style={{ color: 'var(--color-income)' }} /> Ingresos
                    </p>
                    <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-income)' }}>${formatCurrency(income)}</p>
                  </div>

                  <div className="w-px h-6 sm:h-8" style={{ background: 'var(--border)' }} />
                  
                  <div className="flex flex-col items-center">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold mb-1 flex items-center gap-1 justify-center" style={{ color: 'var(--text-muted)' }}>
                      <CreditCard size={10} className="text-blue-500 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Movimientos</span><span className="sm:hidden">Movs.</span>
                    </p>
                    <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{kpiSummary?.transaction_count || 0}</p>
                  </div>
                </div>
                
              </div>

              {/* Recent Activity */}
              <div
                className="rounded-3xl p-5 flex flex-col h-auto lg:h-[360px]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Últimos movimientos</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lo más reciente</p>
                    </div>
                    <Link
                      href="/transactions"
                      className="text-emerald-500 text-xs font-semibold hover:text-emerald-400 transition-colors"
                    >
                      Ver todo →
                    </Link>
                  </div>
                  <div className="flex-1 lg:overflow-y-auto space-y-1 -mx-2 px-2">
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className={`flex justify-between items-center p-2 rounded-xl transition-colors ${tx.is_owner !== false ? 'cursor-pointer hover:bg-zinc-800/20' : 'cursor-default'}`}
                          onClick={() => {
                            if (tx.is_owner === false) return;
                            openModal(tx);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {tx.category_icon || (tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tx.category} · {format(parseISO(tx.date), 'd MMM')}</p>
                            </div>
                          </div>
                          <p className="shrink-0 font-bold text-sm ml-2"
                            style={{ color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                            {tx.type === 'income' ? '+' : '−'}${formatCurrency(tx.amount)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                        <Receipt className="w-9 h-9 mb-3 opacity-20" />
                        <p className="text-sm">Aún no hay movimientos</p>
                        <p className="text-xs mt-1 opacity-60">Empieza añadiendo uno ↑</p>
                      </div>
                    )}
                  </div>
              </div>

              {/* Bottom Row: Categories + KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4">

                {/* Top Spending Categories */}
                <div
                  className="lg:col-span-2 rounded-3xl p-5 flex flex-col h-auto lg:min-h-[240px]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PieChartIcon className="text-emerald-500" size={18} />
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>En esto se va tu dinero</p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    Categorías con más gasto este mes
                  </p>
                  <div className="flex-1 lg:overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                      {categorySummary && categorySummary.length > 0 ? (
                        categorySummary.map((cat, idx) => {
                          const delta = cat.previous_amount !== undefined ? cat.amount - cat.previous_amount! : 0;
                          const isIncrease = delta > 0;
                          const isDecrease = delta < 0;
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl p-3 flex justify-between items-center cursor-pointer transition-all"
                              style={{
                                background: 'var(--bg-inset)',
                                border: '1px solid var(--border-subtle)',
                              }}
                              onClick={() => {
                                let url = `/transactions?category_id=${cat.category_id}`;
                                if (filterMonth) url += `&month=${filterMonth}`;
                                router.push(url);
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                                  style={{ background: 'var(--bg-card)' }}
                                >
                                  {cat.category_icon ? <span>{cat.category_icon}</span> : <Target size={14} style={{ color: 'var(--text-muted)' }} />}
                                </div>
                                <div>
                                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{cat.category}</p>
                                  {cat.previous_amount !== undefined && delta !== 0 && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isIncrease ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {isIncrease ? <ArrowUpRight size={9} className="mr-0.5" /> : <ArrowDownRight size={9} className="mr-0.5" />}
                                        ${formatCurrency(Math.abs(delta))}
                                      </span>
                                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>vs mes anterior</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-red-500 font-bold text-sm">${formatCurrency(cat.amount)}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm py-8 sm:col-span-2" style={{ color: 'var(--text-muted)' }}>
                          Sin datos de categorías aún.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div
                    className="rounded-3xl p-5 flex flex-col justify-between group transition-colors flex-1"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
                        <TrendingDown size={20} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Tu gasto más grande</p>
                      <p className="font-medium text-sm mt-1 truncate" style={{ color: 'var(--text-primary)' }} title={kpiSummary?.largest_expense_title || ''}>
                        {kpiSummary?.largest_expense_title || 'Sin datos'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-red-500 mt-3">
                      ${formatCurrency(kpiSummary?.largest_expense || 0)}
                    </p>
                  </div>

                  <div
                    className="rounded-3xl p-5 flex flex-col justify-between group transition-colors flex-1"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                        <TrendingUp size={20} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Tu mayor ingreso</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-500 mt-3">
                      ${formatCurrency(kpiSummary?.largest_income || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shared Balances */}
              <SharedBalancesCard filterMonth={filterMonth} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
