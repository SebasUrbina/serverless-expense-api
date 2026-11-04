'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import { format, parseISO, isValid, getDaysInMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MonthSelector } from '@/components/MonthSelector';
import { CategoryBreakdownCard } from '@/components/CategoryBreakdownCard';
import { CategoryDeviationsCard } from '@/components/CategoryDeviationsCard';
import { formatCompactValue, formatMoney } from '@/lib/utils';
import {
  categoryDeviations,
  compareWithNormal,
  IN_LINE_PCT,
} from '@/lib/analytics';
import type {
  MonthlySummary,
  CategorySummary,
  CategoryTrendResponse,
} from '@/types/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardNotice, CardStat } from '@/components/ui/Card';
import { useTransactionModal } from '@/store/useTransactionModal';

const INCOME = 'var(--color-income)';
const EXPENSE = 'var(--color-expense)';
const WINDOW_MONTHS = 12;

type TooltipProps = {
  active?: boolean;
  payload?: { color?: string; name?: string; value?: number | string }[];
  label?: string;
};

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border-border shadow-elevated min-w-[150px] rounded-xl border px-3 py-2.5">
      <p className="text-secondary mb-1.5 text-xs font-medium capitalize">
        {label}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-4 text-[13px]"
          >
            <span className="text-secondary flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-[2px]"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="text-primary font-semibold tabular-nums">
              {formatMoney(Number(entry.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-[2px]"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </span>
  );
}

const axisProps = {
  stroke: 'var(--text-muted)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const timesFormat = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 1,
});

function headline({
  pct,
  inProgress,
  monthsCompared,
  notStarted,
}: {
  pct: number | null;
  inProgress: boolean;
  monthsCompared: number;
  notStarted: boolean;
}) {
  if (notStarted) return 'Este mes aún no comienza';
  if (monthsCompared === 0) return 'Aún no hay meses anteriores para comparar';
  if (pct === null)
    return inProgress
      ? 'A esta altura del mes no sueles gastar'
      : 'Aún no hay meses anteriores para comparar';
  const habitual = inProgress ? 'lo habitual a esta altura' : 'lo habitual';
  if (Math.abs(pct) < IN_LINE_PCT)
    return inProgress ? 'Vas en línea con lo habitual' : 'Gastaste lo habitual';
  if (pct >= 100)
    return `${inProgress ? 'Llevas' : 'Gastaste'} ${timesFormat.format(1 + pct / 100)} veces ${habitual}`;
  const abs = Math.abs(pct);
  if (inProgress)
    return `Vas ${abs}% ${pct < 0 ? 'bajo' : 'sobre'} ${habitual}`;
  return `Gastaste ${abs}% ${pct < 0 ? 'menos' : 'más'} que ${habitual}`;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { openModal } = useTransactionModal();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const monthDate = parseISO(`${filterMonth}-01`);
  const monthName = format(monthDate, 'MMMM', { locale: es });
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = today.slice(0, 7);
  const dayQuery =
    filterMonth === currentMonth ? `&day=${Number(today.slice(8, 10))}` : '';

  const { data: response, isLoading: isLoadingSummary } = useQuery<{
    summary: MonthlySummary[];
  }>({
    queryKey: ['transactions', 'analytics', 'monthly', filterMonth, dayQuery],
    queryFn: async () => {
      const res = await api.get(
        `/transactions/summary/monthly?months=${WINDOW_MONTHS}&endMonth=${filterMonth}${dayQuery}`,
      );
      return res.data;
    },
  });

  const { data: categoryResponse, isLoading: isLoadingCategory } = useQuery<{
    summary: CategorySummary[];
  }>({
    queryKey: ['transactions', 'analytics', 'category', filterMonth],
    queryFn: async () => {
      const res = await api.get(
        `/transactions/summary/category?type=expense&month=${filterMonth}`,
      );
      return res.data;
    },
  });

  const { data: trendResponse, isLoading: isLoadingTrend } =
    useQuery<CategoryTrendResponse>({
      queryKey: [
        'transactions',
        'analytics',
        'category-trend',
        filterMonth,
        dayQuery,
      ],
      queryFn: async () => {
        const res = await api.get(
          `/transactions/summary/category-trend?months=${WINDOW_MONTHS}&endMonth=${filterMonth}${dayQuery}`,
        );
        return res.data;
      },
    });

  const monthlySummary = response?.summary || [];
  const categorySummary = categoryResponse?.summary || [];

  const monthLabel = (month: string) => {
    const parsed = parseISO(`${month}-01`);
    return isValid(parsed) ? format(parsed, 'MMM', { locale: es }) : month;
  };

  const chartData = monthlySummary
    .filter((item) => item.month)
    .map((item) => ({
      name: monthLabel(item.month),
      month: item.month,
      Ingresos: item.total_income,
      Gastos: item.total_expense,
    }));

  const notStarted = filterMonth > currentMonth;
  const normal = compareWithNormal(monthlySummary, filterMonth, today);
  const deviations = trendResponse
    ? categoryDeviations(trendResponse, filterMonth)
    : [];

  const selected = monthlySummary.find((m) => m.month === filterMonth);
  const income = selected?.total_income ?? 0;
  const expense = normal.expense;
  const net = income - expense;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;

  const daysElapsed =
    filterMonth === currentMonth
      ? new Date().getDate()
      : filterMonth < currentMonth
        ? getDaysInMonth(monthDate)
        : 0;

  const selectMonth = (datum: unknown) => {
    const month = (datum as { month?: unknown } | null)?.month;
    if (typeof month === 'string') setFilterMonth(month);
  };
  const openMonth = (datum: unknown) => {
    const month = (datum as { month?: unknown } | null)?.month;
    if (typeof month === 'string') router.push(`/transactions?month=${month}`);
  };

  let comparison: ReactNode = null;
  if (!notStarted && normal.expected !== null) {
    comparison = normal.inProgress ? (
      <>
        {' '}
        · a esta altura sueles llevar{' '}
        <b className="text-primary font-semibold">
          {formatMoney(normal.expected)}
        </b>
      </>
    ) : (
      <>
        {' '}
        · tu promedio es{' '}
        <b className="text-primary font-semibold">
          {formatMoney(normal.average)}
        </b>
      </>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Análisis"
        subtitle="Cómo se compara tu mes con lo habitual."
        monthSelector={
          <MonthSelector
            value={filterMonth}
            onChange={setFilterMonth}
            allowAll={false}
          />
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <Card label={`Tu ${monthName} contra tu promedio`} tone="hero">
            {isLoadingSummary ? (
              <LoadingState minHeight="h-48" />
            ) : (
              <>
                <p className="text-secondary text-[13px] capitalize">
                  {monthName}
                  {normal.inProgress && ` · día ${daysElapsed}`}
                </p>
                <h2 className="text-primary mt-1 text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl">
                  {headline({ ...normal, notStarted })}
                </h2>
                <p className="text-secondary mt-2 text-[13px] tabular-nums">
                  <b className="text-primary font-semibold">
                    {formatMoney(expense)}
                  </b>{' '}
                  gastado{comparison}
                </p>

                {chartData.length > 1 && (
                  <div
                    className="mt-4 h-32 sm:h-40 [&_*:focus]:outline-none"
                    role="img"
                    aria-label={`Gasto de los últimos ${chartData.length} meses${normal.average !== null ? `; promedio ${formatMoney(normal.average)}` : ''}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        accessibilityLayer={false}
                        margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="name"
                          {...axisProps}
                          stroke="var(--color-muted)"
                          dy={6}
                          interval="preserveStartEnd"
                        />
                        <Bar
                          dataKey="Gastos"
                          radius={[3, 3, 0, 0]}
                          onClick={selectMonth}
                          cursor="pointer"
                        >
                          {chartData.map((d) => (
                            <Cell
                              key={d.month}
                              fill={
                                d.month === filterMonth
                                  ? 'var(--color-primary)'
                                  : 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                              }
                            />
                          ))}
                        </Bar>
                        {normal.average !== null && (
                          <ReferenceLine
                            y={normal.average}
                            stroke="var(--color-primary)"
                            strokeOpacity={0.7}
                            strokeDasharray="4 4"
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {chartData.length > 1 && normal.average !== null && (
                  <p className="text-secondary mt-3 flex items-center gap-2 text-xs tabular-nums">
                    <span
                      aria-hidden="true"
                      className="border-primary w-4 border-t border-dashed"
                    />
                    Promedio mensual {formatMoney(normal.average)}
                  </p>
                )}

                <dl className="border-border mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                  <CardStat label="Ingresos" className="text-income">
                    {formatMoney(income)}
                  </CardStat>
                  <CardStat
                    label="Neto del mes"
                    className={net < 0 ? 'text-expense' : ''}
                    detail={
                      savingsRate === null
                        ? 'Sin ingresos este mes'
                        : savingsRate >= 0
                          ? `Ahorras el ${savingsRate}%`
                          : `Gastas ${Math.abs(savingsRate)}% más de lo que ganas`
                    }
                  >
                    {formatMoney(net)}
                  </CardStat>
                  <CardStat
                    label="Gasto diario"
                    detail={
                      daysElapsed > 0
                        ? `Promedio en ${daysElapsed} ${daysElapsed === 1 ? 'día' : 'días'}`
                        : 'El mes aún no comienza'
                    }
                  >
                    {daysElapsed > 0 ? formatMoney(expense / daysElapsed) : '—'}
                  </CardStat>
                </dl>
              </>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-3">
              {isLoadingTrend ? (
                <Card>
                  <LoadingState minHeight="h-64" />
                </Card>
              ) : (
                <CategoryDeviationsCard
                  deviations={deviations}
                  month={filterMonth}
                  inProgress={normal.inProgress}
                  monthsCompared={normal.monthsCompared}
                />
              )}
            </div>

            <div className="min-w-0 lg:col-span-2">
              {isLoadingCategory ? (
                <Card>
                  <LoadingState minHeight="h-64" />
                </Card>
              ) : (
                <CategoryBreakdownCard
                  categories={categorySummary}
                  month={filterMonth}
                  onAdd={() => openModal()}
                />
              )}
            </div>
          </div>

          <Card label="Ingresos y gastos">
            <CardHeader
              title="Ingresos y gastos"
              description={
                <ChartLegend
                  items={[
                    { label: 'Ingresos', color: INCOME },
                    { label: 'Gastos', color: EXPENSE },
                  ]}
                />
              }
            />
            {isLoadingSummary ? (
              <LoadingState minHeight="h-64" />
            ) : chartData.length === 0 ? (
              <CardNotice
                className="mt-5"
                title="Aún no hay suficientes datos"
                description="El gráfico aparecerá cuando registres movimientos en más meses."
              />
            ) : (
              <div className="mt-5 h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    barGap={2}
                    margin={{ top: 4, right: 0, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" {...axisProps} dy={8} />
                    <YAxis
                      {...axisProps}
                      tickFormatter={formatCompactValue}
                      width={56}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--bg-inset)' }}
                      content={<ChartTooltip />}
                    />
                    <Bar
                      dataKey="Ingresos"
                      fill={INCOME}
                      radius={[3, 3, 0, 0]}
                      onClick={openMonth}
                      cursor="pointer"
                    />
                    <Bar
                      dataKey="Gastos"
                      fill={EXPENSE}
                      radius={[3, 3, 0, 0]}
                      onClick={openMonth}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
