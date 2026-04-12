'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, Cell, ComposedChart, LabelList, Line } from 'recharts';
import { format, parseISO, isValid, addMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonthSelector } from '@/components/MonthSelector';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Settings } from 'lucide-react';
import { formatCompactValue } from '@/lib/utils';
import Link from 'next/link';
import type { MonthlySummary, CategorySummary } from '@/types/api';

type ChartDatum = {
  name: string;
  originalMonth: string;
  Ingresos: number;
  Gastos: number;
  Balance: number;
};

type SavingsDatum = {
  name: string;
  Ahorro: number;
  isProjection: boolean;
};

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type TooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-2xl shadow-xl min-w-[140px]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <p
          className="text-sm font-medium mb-3 pb-2"
          style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
        >
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            let color = entry.color;
            if (entry.name === 'Ingresos') color = '#10b981';
            if (entry.name === 'Gastos') color = '#f43f5e';
            return (
              <div key={index} className="flex items-center justify-between gap-6">
                <span className="text-sm font-medium" style={{ color }}>{entry.name}</span>
                <span className="text-sm font-bold" style={{ color }}>
                  ${Number(entry.value).toLocaleString('es-CL')}
                </span>
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
  const router = useRouter();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: response, isLoading: isLoadingSummary } = useQuery<{ summary: MonthlySummary[] }>({
    queryKey: ['transactions', 'analytics', 'monthly', filterMonth],
    queryFn: async () => {
      let url = '/transactions/summary/monthly?months=12';
      if (filterMonth) {
        const selectedMonth = parseISO(`${filterMonth}-01`);
        url += `&endDate=${format(endOfMonth(selectedMonth), 'yyyy-MM-dd')}`;
      }
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

  const chartData: ChartDatum[] = monthlySummary
    .filter((item) => item.month)
    .map((item) => {
      const parsedDate = parseISO(`${item.month}-01`);
      return {
        name: isValid(parsedDate) ? format(parsedDate, 'MMM', { locale: es }) : item.month,
        originalMonth: item.month,
        Ingresos: item.total_income,
        Gastos: item.total_expense,
        Balance: Math.max(0, item.total_income - item.total_expense),
      };
    });

  const savingsData: SavingsDatum[] = chartData.map((d) => ({
    name: d.name,
    Ahorro: d.Balance,
    isProjection: false,
  }));

  if (!filterMonth && chartData.length > 0) {
    const recentMonths = chartData.slice(-3);
    const avgSavings = recentMonths.reduce((sum, item) => sum + item.Balance, 0) / recentMonths.length;
    const lastMonthRaw = monthlySummary.filter(m => m.month).pop()?.month;
    if (lastMonthRaw) {
      const lastDate = parseISO(`${lastMonthRaw}-01`);
      if (isValid(lastDate)) {
        const nextDate = addMonths(lastDate, 1);
        savingsData.push({ name: format(nextDate, 'MMM', { locale: es }) + ' (est.)', Ahorro: avgSavings, isProjection: true });
      }
    }
  }

  const totalExpense = categorySummary.reduce((acc, curr) => acc + curr.amount, 0);

  const openTransactionsForMonth = (data: unknown) => {
    if (!data || typeof data !== 'object' || !('originalMonth' in data)) {
      return;
    }

    const month = data.originalMonth;
    if (typeof month === 'string' && month) {
      router.push(`/transactions?month=${month}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Tu dinero en perspectiva
            </h1>
            <p className="text-sm mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              Tendencias, categorías y ahorro a lo largo del tiempo.
            </p>
          </div>
          <div className="shrink-0 relative z-20 flex items-center gap-2">
            <MonthSelector value={filterMonth} onChange={setFilterMonth} />
            <Link
              href="/settings"
              className="sm:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              aria-label="Ajustes"
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Cashflow Chart */}
          <div
            className="rounded-3xl p-5 flex flex-col h-[320px] sm:h-[400px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Flujo de dinero</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Ingresos, gastos y ahorro mes a mes</p>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactValue} width={50} domain={[0, 'auto']} />
                    <Tooltip cursor={{ fill: 'var(--border)', opacity: 0.4 }} content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }} />
                    <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]}
                      onClick={openTransactionsForMonth}
                      cursor="pointer"
                    >
                      <LabelList dataKey="Ingresos" position="top" fill="var(--text-muted)" fontSize={9} className="hidden sm:block" formatter={(val) => val ? formatCompactValue(Number(val)) : ''} />
                    </Bar>
                    <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]}
                      onClick={openTransactionsForMonth}
                      cursor="pointer"
                    >
                      <LabelList dataKey="Gastos" position="top" fill="var(--text-muted)" fontSize={9} className="hidden sm:block" formatter={(val) => val ? formatCompactValue(Number(val)) : ''} />
                    </Bar>
                    <Line type="monotone" dataKey="Balance" name="Ahorro" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#c084fc' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Aún no hay datos para mostrar.
              </div>
            )}
          </div>


          {/* Row 1: Area Chart + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {/* Area Chart */}
            <div
              className="lg:col-span-2 xl:col-span-3 rounded-3xl p-5 flex flex-col min-h-[320px] sm:min-h-[400px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                Flujo anual de dinero
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Ingresos y gastos de los últimos 12 meses
              </p>
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
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactValue} width={60} />
                      <Tooltip cursor={{ fill: 'var(--border)', opacity: 0.4 }} content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Aún no hay suficientes datos.
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div
              className="lg:col-span-1 xl:col-span-1 rounded-3xl p-5 flex flex-col h-[320px] sm:h-[400px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                ¿En qué se va el dinero?
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Por categoría este mes</p>
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
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
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
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              ${cat.amount.toLocaleString('es-CL')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--bg-inset)' }}>
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
                <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Sin datos de categorías.
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Savings */}
          <div
            className="rounded-3xl p-5 flex flex-col h-[260px] sm:h-[340px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-500" />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Tu ahorro mes a mes
              </p>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Lo que te sobra después de gastos
            </p>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
              </div>
            ) : savingsData.length > 0 ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactValue} width={60} />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const payload = item?.payload as SavingsDatum | undefined;
                        return [
                          `$${Number(value ?? 0).toLocaleString('es-CL')}`,
                          payload?.isProjection ? 'Ahorro estimado' : 'Ahorro'
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '13px'
                      }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                    />
                    <Bar dataKey="Ahorro" radius={[4, 4, 0, 0]}>
                      {savingsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.Ahorro >= 0 ? '#10b981' : '#f43f5e'}
                          fillOpacity={entry.isProjection ? 0.3 : 1}
                          stroke={entry.isProjection ? (entry.Ahorro >= 0 ? '#10b981' : '#f43f5e') : 'none'}
                          strokeDasharray={entry.isProjection ? '4 4' : 'none'}
                          strokeWidth={entry.isProjection ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Aún no hay datos de ahorro.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
