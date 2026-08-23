'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  LabelList,
  Line,
} from 'recharts';
import { format, parseISO, isValid, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonthSelector } from '@/components/MonthSelector';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PiggyBank,
  Calendar,
  Target,
  Activity,
} from 'lucide-react';
import { formatCompactValue, formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { useAnalyticsData } from '@/features/analytics/hooks/useAnalyticsData';

const TREND_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#f43f5e',
  '#84cc16',
  '#14b8a6',
  '#a855f7',
];

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
      <div className="bg-card border-border min-w-[140px] rounded-2xl border p-3 shadow-xl">
        <p className="text-muted border-border mb-3 border-b pb-2 text-sm font-medium">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            let color = entry.color;
            if (entry.name === 'Ingresos') color = '#10b981';
            if (entry.name === 'Gastos') color = '#f43f5e';
            return (
              <div
                key={index}
                className="flex items-center justify-between gap-6"
              >
                <span className="text-sm font-medium" style={{ color }}>
                  {entry.name}
                </span>
                <span className="text-sm font-bold" style={{ color }}>
                  ${formatCurrency(Number(entry.value))}
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

  const {
    monthlySummary,
    categorySummary,
    trend: trendResponse,
    isLoadingTrend,
    isLoading,
  } = useAnalyticsData(filterMonth);

  // Build stacked-bar trend data: months × (top categories + Otros)
  const trendMonths = trendResponse?.months || [];
  const trendCategories = trendResponse?.categories || [];
  const topCategories = trendCategories.slice(0, 6);
  const othersCategories = trendCategories.slice(6);
  const trendData = trendMonths.map((month, idx) => {
    const parsed = parseISO(`${month}-01`);
    const datum: Record<string, number | string> = {
      name: isValid(parsed) ? format(parsed, 'MMM', { locale: es }) : month,
    };
    for (const cat of topCategories) {
      datum[cat.category ?? 'Sin categoría'] = cat.values[idx] || 0;
    }
    const othersSum = othersCategories.reduce(
      (s, c) => s + (c.values[idx] || 0),
      0,
    );
    if (othersSum > 0) datum['Otros'] = othersSum;
    return datum;
  });

  const chartData: ChartDatum[] = monthlySummary
    .filter((item) => item.month)
    .map((item) => {
      const parsedDate = parseISO(`${item.month}-01`);
      return {
        name: isValid(parsedDate)
          ? format(parsedDate, 'MMM', { locale: es })
          : item.month,
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
    const avgSavings =
      recentMonths.reduce((sum, item) => sum + item.Balance, 0) /
      recentMonths.length;
    const lastMonthRaw = monthlySummary.filter((m) => m.month).pop()?.month;
    if (lastMonthRaw) {
      const lastDate = parseISO(`${lastMonthRaw}-01`);
      if (isValid(lastDate)) {
        const nextDate = addMonths(lastDate, 1);
        savingsData.push({
          name: format(nextDate, 'MMM', { locale: es }) + ' (est.)',
          Ahorro: avgSavings,
          isProjection: true,
        });
      }
    }
  }

  const totalExpense = categorySummary.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  const openTransactionsForMonth = (data: unknown) => {
    if (!data || typeof data !== 'object' || !('originalMonth' in data)) {
      return;
    }

    const month = data.originalMonth;
    if (typeof month === 'string' && month) {
      router.push(`/transactions?month=${month}`);
    }
  };

  // Calculate KPIs for the selected month
  const selectedMonthData = monthlySummary.find((m) => m.month === filterMonth);
  const selectedIncome = selectedMonthData?.total_income ?? 0;
  const selectedExpense = selectedMonthData?.total_expense ?? 0;
  const selectedSavings = selectedIncome - selectedExpense;
  const savingsRate =
    selectedIncome > 0 ? (selectedSavings / selectedIncome) * 100 : 0;

  // Calculate average daily spending
  const daysInMonth = filterMonth
    ? new Date(
        Number(filterMonth.split('-')[0]),
        Number(filterMonth.split('-')[1]),
        0,
      ).getDate()
    : 30;
  const dailyAverage = selectedExpense / daysInMonth;

  // Top category
  const topCategory = categorySummary.length > 0 ? categorySummary[0] : null;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <PageHeader
        title="Tu dinero en perspectiva"
        subtitle="Tendencias, categorías y ahorro a lo largo del tiempo."
        monthSelector={
          <MonthSelector value={filterMonth} onChange={setFilterMonth} />
        }
      />

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Card 1: Ahorro Neto */}
            <div className="bg-card border-border flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/20">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Ahorro Neto
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                  <PiggyBank size={16} />
                </div>
              </div>
              <div>
                <p
                  className={`text-xl font-black tracking-tight sm:text-2xl ${selectedSavings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {selectedSavings >= 0 ? '+' : '−'}$
                  {formatCurrency(Math.abs(selectedSavings))}
                </p>
                <p className="text-muted mt-1 text-[11px] font-medium">
                  Tasa de ahorro:{' '}
                  <span className="font-bold text-emerald-500">
                    {savingsRate.toFixed(0)}%
                  </span>
                </p>
              </div>
            </div>

            {/* Card 2: Gasto Diario */}
            <div className="bg-card border-border flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:border-red-500/20">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Gasto Diario
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 shadow-inner">
                  <Calendar size={16} />
                </div>
              </div>
              <div>
                <p className="text-primary text-xl font-black tracking-tight sm:text-2xl">
                  ${formatCurrency(dailyAverage)}
                </p>
                <p className="text-muted mt-1 text-[11px] font-medium">
                  Promedio en {daysInMonth} días
                </p>
              </div>
            </div>

            {/* Card 3: Categoría Principal */}
            <div className="bg-card border-border flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:border-violet-500/20">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Mayor Categoría
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 shadow-inner">
                  <Target size={16} />
                </div>
              </div>
              <div>
                <p
                  className="text-primary truncate text-xl font-black tracking-tight sm:text-2xl"
                  title={topCategory ? topCategory.category : 'Ninguna'}
                >
                  {topCategory
                    ? `${topCategory.category_icon || ''} ${topCategory.category}`
                    : 'Ninguna'}
                </p>
                <p className="text-muted mt-1 text-[11px] font-medium">
                  {topCategory
                    ? `Gasto: $${formatCurrency(topCategory.amount)}`
                    : 'Sin gastos'}
                </p>
              </div>
            </div>

            {/* Card 4: Eficiencia */}
            <div className="bg-card border-border flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:border-blue-500/20">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                  Eficiencia
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shadow-inner">
                  <Activity size={16} />
                </div>
              </div>
              <div>
                <p className="text-primary text-xl font-black tracking-tight sm:text-2xl">
                  {selectedIncome > 0
                    ? ((selectedExpense / selectedIncome) * 100).toFixed(0) +
                      '%'
                    : '0%'}
                </p>
                <p className="text-muted mt-1 text-[11px] font-medium">
                  De tus ingresos gastados
                </p>
              </div>
            </div>
          </div>

          {/* Cashflow Chart */}
          <div className="bg-card border-border flex h-[320px] flex-col rounded-3xl border p-5 shadow-sm sm:h-[400px]">
            <p className="text-primary mb-1 text-sm font-bold">
              Flujo de dinero
            </p>
            <p className="text-muted mb-4 text-xs">
              Ingresos, gastos y ahorro mes a mes
            </p>
            {isLoading ? (
              <LoadingState minHeight="h-full" />
            ) : chartData.length > 0 ? (
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 24, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactValue}
                      width={50}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                      content={<CustomTooltip />}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '16px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    />
                    <Bar
                      dataKey="Ingresos"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      onClick={openTransactionsForMonth}
                      cursor="pointer"
                    >
                      <LabelList
                        dataKey="Ingresos"
                        position="top"
                        fill="var(--text-muted)"
                        fontSize={9}
                        className="hidden sm:block"
                        formatter={(val) =>
                          val ? formatCompactValue(Number(val)) : ''
                        }
                      />
                    </Bar>
                    <Bar
                      dataKey="Gastos"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      onClick={openTransactionsForMonth}
                      cursor="pointer"
                    >
                      <LabelList
                        dataKey="Gastos"
                        position="top"
                        fill="var(--text-muted)"
                        fontSize={9}
                        className="hidden sm:block"
                        formatter={(val) =>
                          val ? formatCompactValue(Number(val)) : ''
                        }
                      />
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="Balance"
                      name="Ahorro"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      dot={{ fill: '#a855f7', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: '#c084fc' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-muted flex flex-1 items-center justify-center text-sm">
                Aún no hay datos para mostrar.
              </div>
            )}
          </div>

          {/* Row 1: Area Chart + Category Breakdown */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {/* Area Chart */}
            <div className="bg-card border-border flex h-[320px] flex-col rounded-3xl border p-5 shadow-sm sm:h-[400px] lg:col-span-2 xl:col-span-3">
              <p className="text-primary mb-1 text-sm font-bold">
                Flujo anual de dinero
              </p>
              <p className="text-muted mb-4 text-xs">
                Ingresos y gastos de los últimos 12 meses
              </p>
              {isLoading ? (
                <LoadingState minHeight="h-full" />
              ) : chartData.length > 0 ? (
                <div className="min-h-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--text-muted)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatCompactValue}
                        width={60}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                        content={<CustomTooltip />}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Ingresos"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Gastos"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-muted flex flex-1 items-center justify-center text-sm">
                  Aún no hay suficientes datos.
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-card border-border flex h-[320px] flex-col rounded-3xl border p-5 shadow-sm sm:h-[400px] lg:col-span-1 xl:col-span-1">
              <p className="text-primary mb-1 text-sm font-bold">
                ¿En qué se va el dinero?
              </p>
              <p className="text-muted mb-4 text-xs">Por categoría este mes</p>
              {isLoading ? (
                <LoadingState minHeight="h-full" />
              ) : categorySummary.length > 0 ? (
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  {categorySummary.map((cat, idx) => {
                    const percentage =
                      totalExpense > 0
                        ? ((cat.amount / totalExpense) * 100).toFixed(1)
                        : '0.0';
                    const delta =
                      cat.previous_amount !== undefined
                        ? cat.amount - cat.previous_amount!
                        : 0;
                    const isIncrease = delta > 0;

                    return (
                      <div key={idx}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-primary flex items-center gap-1.5 text-sm font-medium">
                            {cat.category_icon && (
                              <span>{cat.category_icon}</span>
                            )}
                            {cat.category}
                          </span>
                          <div className="flex items-center gap-2">
                            {delta !== 0 &&
                              cat.previous_amount !== undefined && (
                                <span
                                  className={`flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isIncrease ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                                >
                                  {isIncrease ? (
                                    <ArrowUpRight
                                      size={10}
                                      className="mr-0.5"
                                    />
                                  ) : (
                                    <ArrowDownRight
                                      size={10}
                                      className="mr-0.5"
                                    />
                                  )}
                                  ${formatCurrency(Math.abs(delta))}
                                </span>
                              )}
                            <span className="text-primary text-sm font-semibold">
                              ${formatCurrency(cat.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-inset h-1.5 flex-1 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[11px] font-bold text-emerald-500">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-muted flex flex-1 items-center justify-center text-sm">
                  Sin datos de categorías.
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Savings */}
          <div className="bg-card border-border flex h-[260px] flex-col rounded-3xl border p-5 shadow-sm sm:h-[340px]">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <p className="text-primary text-sm font-bold">
                Tu ahorro mes a mes
              </p>
            </div>
            <p className="text-muted mb-4 text-xs">
              Lo que te sobra después de gastos
            </p>
            {isLoading ? (
              <LoadingState minHeight="h-full" />
            ) : savingsData.length > 0 ? (
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={savingsData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactValue}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const payload = item?.payload as
                          SavingsDatum | undefined;
                        return [
                          `$${formatCurrency(Number(value ?? 0))}`,
                          payload?.isProjection ? 'Ahorro estimado' : 'Ahorro',
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
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
                          stroke={
                            entry.isProjection
                              ? entry.Ahorro >= 0
                                ? '#10b981'
                                : '#f43f5e'
                              : 'none'
                          }
                          strokeDasharray={entry.isProjection ? '4 4' : 'none'}
                          strokeWidth={entry.isProjection ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-muted flex flex-1 items-center justify-center text-sm">
                Aún no hay datos de ahorro.
              </div>
            )}
          </div>

          {/* Row 3: Category trend */}
          <div className="bg-card border-border flex h-[360px] flex-col rounded-3xl border p-5 shadow-sm sm:h-[440px]">
            <p className="text-primary mb-1 text-sm font-bold">
              Tendencia por categoría
            </p>
            <p className="text-muted mb-4 text-xs">
              Cómo cambia tu gasto por categoría en los últimos 12 meses
            </p>
            {isLoadingTrend ? (
              <LoadingState minHeight="h-full" />
            ) : trendData.length > 0 && topCategories.length > 0 ? (
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactValue}
                      width={60}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--border)', opacity: 0.3 }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      formatter={(value, name) => [
                        `$${formatCurrency(Number(value ?? 0))}`,
                        String(name),
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '16px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    />
                    {topCategories.map((cat, i) => (
                      <Bar
                        key={cat.category_id ?? i}
                        dataKey={cat.category ?? 'Sin categoría'}
                        stackId="trend"
                        fill={TREND_COLORS[i % TREND_COLORS.length]}
                        radius={
                          i === topCategories.length - 1 ? [4, 4, 0, 0] : 0
                        }
                      />
                    ))}
                    {othersCategories.length > 0 && (
                      <Bar
                        dataKey="Otros"
                        stackId="trend"
                        fill="#71717a"
                        radius={[0, 0, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-muted flex flex-1 items-center justify-center text-sm">
                Aún no hay suficientes datos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
