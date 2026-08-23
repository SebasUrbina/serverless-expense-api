'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { format, parseISO } from 'date-fns';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MonthSelector } from '@/components/MonthSelector';
import { SharedBalancesCard } from '@/components/SharedBalancesCard';
import { MonthlyBudgetCard } from '@/components/MonthlyBudgetCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { useTransactionModal } from '@/store/useTransactionModal';
import { useAuth } from '@/lib/AuthProvider';
import { deriveDashboardMetrics } from '@/features/dashboard/model/dashboard-metrics';

const DONUT_COLORS = [
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

function EmptyDonut() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-40 w-40">
        <div className="border-border absolute inset-0 rounded-full border-8 border-dashed" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Target size={22} className="text-muted" />
        </div>
      </div>
      <p className="text-muted mt-4 text-sm">
        Sin datos de categorías este mes.
      </p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { session } = useAuth();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<
    number | null
  >(null);
  const {
    recentTransactions,
    monthlySummary,
    categorySummary,
    kpiSummary,
    selectedMonthSummary,
    netResult,
    isLoading,
  } = useDashboardData(filterMonth);
  const { openModal } = useTransactionModal();

  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.display_name;
  const firstName =
    typeof displayName === 'string' ? displayName.split(' ')[0] : null;

  const {
    expense,
    income,
    previousExpense,
    expenseDelta: expenseDeltaRaw,
    totalExpense,
  } = deriveDashboardMetrics({
      month: filterMonth,
      monthlySummary,
      categorySummary,
      selectedMonth: selectedMonthSummary,
    });
  const isExpenseIncrease = expenseDeltaRaw > 0;
  const isExpenseDecrease = expenseDeltaRaw < 0;
  const absExpenseDelta = Math.abs(expenseDeltaRaw).toFixed(0);

  const goToCategory = (categoryId: number) => {
    let url = `/transactions?category_id=${categoryId}`;
    if (filterMonth) url += `&month=${filterMonth}`;
    router.push(url);
  };

  const customTitle = (
    <div>
      <div className="sm:hidden">
        <p className="text-muted mb-0.5 text-[0.65rem] font-bold tracking-[0.2em] uppercase">
          Bienvenido 👋
        </p>
        <h1 className="text-primary truncate text-2xl leading-tight font-extrabold tracking-tight">
          {firstName || 'Mi resumen'}
        </h1>
      </div>
      <div className="hidden sm:block">
        <h1 className="text-primary truncate text-3xl leading-tight font-black tracking-tighter sm:text-4xl">
          <span>{firstName ? `Hola, ${firstName}` : 'Mi resumen'}</span>
          <span className="ml-2 inline-block align-middle text-[0.85em]">
            👋
          </span>
        </h1>
        <p className="text-muted mt-1 text-sm font-medium">
          Aquí puedes ver en qué se va tu dinero.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <PageHeader
        title=""
        customTitle={customTitle}
        monthSelector={
          <MonthSelector
            value={filterMonth}
            onChange={setFilterMonth}
            className="min-w-0"
          />
        }
        primaryAction={{
          label: 'Agregar',
          onClick: () => openModal(),
        }}
      />

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <LoadingState minHeight="h-64" />
          ) : (
            <div className="space-y-6">
              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column (spans 2) */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Gasto Hero */}
                  <div className="bg-card border-border relative flex flex-col items-center rounded-3xl border p-8 text-center shadow-sm sm:p-10">
                    <Link
                      href={`/analytics?month=${filterMonth}`}
                      className="text-accent bg-accent-soft hover:bg-accent/20 absolute top-5 right-5 hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase transition-colors sm:flex"
                    >
                      Desglose detallado
                    </Link>

                    <p className="text-muted mb-2 text-xs font-semibold tracking-[0.2em] uppercase sm:text-sm">
                      {filterMonth ? 'Este mes has gastado' : 'Gasto Total'}
                    </p>
                    <div
                      className="mb-5 flex cursor-pointer items-baseline gap-1 leading-none tabular-nums transition-opacity hover:opacity-80"
                      onClick={() =>
                        router.push(`/analytics?month=${filterMonth}`)
                      }
                    >
                      <span className="text-secondary mb-1 text-3xl font-bold sm:text-4xl">
                        $
                      </span>
                      <h2 className="text-primary text-5xl font-black tracking-tighter tabular-nums sm:text-7xl">
                        {formatCurrency(expense)}
                      </h2>
                    </div>

                    {/* vs previous month */}
                    {filterMonth && previousExpense > 0 && (
                      <div className="bg-inset border-border flex items-center gap-2 rounded-full border px-4 py-1.5">
                        <span className="text-muted text-[10px] font-bold tracking-[0.15em] uppercase">
                          vs mes pasado
                        </span>
                        <span
                          className={`flex items-center gap-1 text-xs font-bold tabular-nums ${
                            isExpenseIncrease
                              ? 'text-red-500 dark:text-red-400'
                              : isExpenseDecrease
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-secondary'
                          }`}
                        >
                          {isExpenseIncrease
                            ? `+${absExpenseDelta}%`
                            : isExpenseDecrease
                              ? `-${absExpenseDelta}%`
                              : `0%`}
                        </span>
                      </div>
                    )}

                    {/* Mini metrics */}
                    <div className="divide-border border-border bg-inset/60 mx-auto mt-8 grid w-full max-w-md grid-cols-3 divide-x rounded-2xl border">
                      <div className="flex flex-col items-center py-4">
                        <p className="text-muted mb-1 flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase sm:text-[10px]">
                          <Wallet
                            size={12}
                            className="text-violet-500 dark:text-violet-400"
                          />{' '}
                          Resultado
                        </p>
                        <p
                          className={`text-sm font-bold tabular-nums sm:text-base ${
                            netResult < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-violet-600 dark:text-violet-400'
                          }`}
                        >
                          ${formatCurrency(netResult)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center py-4">
                        <p className="text-muted mb-1 flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase sm:text-[10px]">
                          <ArrowUpRight
                            size={12}
                            className="text-emerald-500 dark:text-emerald-400"
                          />{' '}
                          Ingresos
                        </p>
                        <p className="text-sm font-bold text-emerald-600 tabular-nums sm:text-base dark:text-emerald-400">
                          ${formatCurrency(income)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center py-4">
                        <p className="text-muted mb-1 flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase sm:text-[10px]">
                          <CreditCard size={12} className="text-blue-500" />{' '}
                          <span className="hidden sm:inline">Movimientos</span>
                          <span className="sm:hidden">Movs.</span>
                        </p>
                        <p className="text-primary text-base font-bold tabular-nums sm:text-lg">
                          {kpiSummary?.transaction_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ritmo del mes */}
                  {filterMonth && (
                    <MonthlyBudgetCard month={filterMonth} expense={expense} />
                  )}

                  {/* Categorías: donut + lista */}
                  <div className="bg-card border-border rounded-3xl border p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2.5">
                      <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-2xl">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-primary text-base font-bold">
                          En esto se va tu dinero
                        </p>
                        <p className="text-muted mt-0.5 text-xs">
                          Categorías con más gasto este mes
                        </p>
                      </div>
                    </div>

                    {categorySummary.length > 0 ? (
                      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                        {/* Donut */}
                        <div
                          className="relative mx-auto h-56 w-full max-w-[240px] select-none"
                          style={{
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none',
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categorySummary.map((cat, i) => ({
                                  ...cat,
                                  fill: DONUT_COLORS[i % DONUT_COLORS.length],
                                }))}
                                dataKey="amount"
                                nameKey="category"
                                innerRadius="68%"
                                outerRadius="100%"
                                paddingAngle={2}
                                strokeWidth={0}
                                onMouseEnter={(_, index) =>
                                  setHoveredCategoryIndex(index)
                                }
                                onMouseLeave={() =>
                                  setHoveredCategoryIndex(null)
                                }
                                onClick={(entry) => {
                                  const id = (
                                    entry as
                                      | { payload?: { category_id?: number } }
                                      | undefined
                                  )?.payload?.category_id;
                                  if (id) goToCategory(id);
                                }}
                                cursor="pointer"
                              >
                                {categorySummary.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                                    className="outline-none"
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                wrapperStyle={{ zIndex: 50, outline: 'none' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0];
                                    const catName =
                                      data.name || data.payload?.category || '';
                                    const icon =
                                      data.payload?.category_icon || '';
                                    const amount = Number(data.value ?? 0);
                                    const pct =
                                      totalExpense > 0
                                        ? (
                                            (amount / totalExpense) *
                                            100
                                          ).toFixed(1)
                                        : '0.0';
                                    const fillColor =
                                      data.payload?.fill || '#6366f1';

                                    return (
                                      <div className="bg-card border-border relative z-50 min-w-[160px] rounded-2xl border p-3 shadow-2xl">
                                        <div className="mb-1.5 flex items-center gap-2">
                                          <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                              backgroundColor: fillColor,
                                            }}
                                          />
                                          <span className="text-primary truncate text-xs font-bold">
                                            {icon ? `${icon} ` : ''}
                                            {catName}
                                          </span>
                                        </div>
                                        <div className="flex items-baseline justify-between gap-3">
                                          <span className="text-primary text-sm font-black tabular-nums">
                                            ${formatCurrency(amount)}
                                          </span>
                                          <span className="text-accent bg-accent/10 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums">
                                            {pct}%
                                          </span>
                                        </div>
                                        <p className="text-muted mt-1 text-[10px] font-medium">
                                          del gasto mensual
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center select-none">
                            {hoveredCategoryIndex !== null &&
                            categorySummary[hoveredCategoryIndex] ? (
                              <>
                                <span className="flex max-w-[150px] items-center gap-1 truncate text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                                  {categorySummary[hoveredCategoryIndex]
                                    .category_icon || '🏷️'}{' '}
                                  {
                                    categorySummary[hoveredCategoryIndex]
                                      .category
                                  }{' '}
                                  (
                                  {totalExpense > 0
                                    ? (
                                        (categorySummary[hoveredCategoryIndex]
                                          .amount /
                                          totalExpense) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                                <span className="text-primary mt-0.5 text-lg font-black tabular-nums">
                                  $
                                  {formatCurrency(
                                    categorySummary[hoveredCategoryIndex]
                                      .amount,
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-muted text-[10px] font-bold tracking-wider uppercase">
                                  Total
                                </span>
                                <span className="text-primary text-lg font-black tabular-nums">
                                  ${formatCurrency(totalExpense)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Lista */}
                        <div className="space-y-2">
                          {categorySummary.map((cat, idx) => {
                            const percentage =
                              totalExpense > 0
                                ? ((cat.amount / totalExpense) * 100).toFixed(0)
                                : '0';
                            const delta =
                              cat.previous_amount !== undefined
                                ? cat.amount - cat.previous_amount!
                                : 0;
                            const isIncrease = delta > 0;
                            const color =
                              DONUT_COLORS[idx % DONUT_COLORS.length];
                            return (
                              <div
                                key={idx}
                                className="hover:bg-inset flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors"
                                onClick={() => goToCategory(cat.category_id)}
                              >
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ background: color }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-primary flex items-center gap-1.5 truncate text-sm font-semibold">
                                      {cat.category_icon && (
                                        <span>{cat.category_icon}</span>
                                      )}
                                      {cat.category}
                                    </p>
                                    <p className="text-primary ml-2 shrink-0 text-sm font-bold tabular-nums">
                                      ${formatCurrency(cat.amount)}
                                    </p>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <div className="bg-inset h-1.5 flex-1 overflow-hidden rounded-full">
                                      <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                          width: `${percentage}%`,
                                          background: color,
                                        }}
                                      />
                                    </div>
                                    <span className="text-muted w-8 text-right text-[10px] font-bold tabular-nums">
                                      {percentage}%
                                    </span>
                                  </div>
                                  {delta !== 0 &&
                                    cat.previous_amount !== undefined && (
                                      <p className="text-muted mt-0.5 text-[10px]">
                                        <span
                                          className={
                                            isIncrease
                                              ? 'text-red-500 dark:text-red-400'
                                              : 'text-emerald-600 dark:text-emerald-400'
                                          }
                                        >
                                          {isIncrease ? '▲' : '▼'} $
                                          {formatCurrency(Math.abs(delta))}
                                        </span>{' '}
                                        vs mes anterior
                                      </p>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <EmptyDonut />
                    )}
                  </div>
                </div>

                {/* Right Column (spans 1) */}
                <div className="space-y-6 lg:col-span-1">
                  {/* Recent Activity */}
                  <div className="bg-card border-border flex h-auto flex-col rounded-3xl border p-6 shadow-sm lg:h-[480px]">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-primary text-base font-bold">
                          Últimos movimientos
                        </p>
                        <p className="text-muted mt-0.5 text-xs">
                          Lo más reciente
                        </p>
                      </div>
                      <Link
                        href="/transactions"
                        className="text-accent bg-accent-soft rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-opacity hover:opacity-80"
                      >
                        Ver todo →
                      </Link>
                    </div>
                    <div className="-mx-2 flex-1 space-y-1.5 px-2 lg:overflow-y-auto">
                      {recentTransactions.length > 0 ? (
                        recentTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className={`flex items-center justify-between rounded-2xl p-3 transition-all duration-300 ${
                              tx.is_owner !== false
                                ? 'hover:bg-inset cursor-pointer'
                                : 'cursor-default'
                            }`}
                            onClick={() => {
                              if (tx.is_owner === false) return;
                              openModal(tx);
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-3.5">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${
                                  tx.type === 'income'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}
                              >
                                {tx.category_icon ||
                                  (tx.type === 'income' ? (
                                    <ArrowUpRight size={18} />
                                  ) : (
                                    <ArrowDownRight size={18} />
                                  ))}
                              </div>
                              <div className="min-w-0">
                                <p className="text-primary truncate text-sm font-bold">
                                  {tx.title}
                                </p>
                                <p className="text-muted mt-0.5 text-xs font-medium">
                                  {tx.category} ·{' '}
                                  {format(parseISO(tx.date), 'd MMM')}
                                </p>
                              </div>
                            </div>
                            <p
                              className="ml-2 shrink-0 text-sm font-bold tabular-nums"
                              style={{
                                color:
                                  tx.type === 'income'
                                    ? 'var(--color-income)'
                                    : 'var(--color-expense)',
                              }}
                            >
                              {tx.type === 'income' ? '+' : '−'}$
                              {formatCurrency(tx.amount)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted flex h-full flex-col items-center justify-center">
                          <Receipt className="mb-3 h-9 w-9 opacity-30" />
                          <p className="text-sm">Aún no hay movimientos</p>
                          <p className="mt-1 text-xs opacity-70">
                            Empieza añadiendo uno ↑
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-card border-border flex items-center justify-between gap-3 rounded-3xl border p-5 shadow-sm">
                      <div className="min-w-0">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                          <TrendingDown size={20} />
                        </div>
                        <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                          Gasto más grande
                        </p>
                        <p
                          className="text-primary mt-1 truncate text-sm font-bold"
                          title={kpiSummary?.largest_expense_title || ''}
                        >
                          {kpiSummary?.largest_expense_title || 'Sin datos'}
                        </p>
                      </div>
                      <p className="shrink-0 text-2xl font-black text-red-500 tabular-nums">
                        ${formatCurrency(kpiSummary?.largest_expense || 0)}
                      </p>
                    </div>

                    <div className="bg-card border-border flex items-center justify-between gap-3 rounded-3xl border p-5 shadow-sm">
                      <div className="min-w-0">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                          <TrendingUp size={20} />
                        </div>
                        <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                          Mayor ingreso
                        </p>
                      </div>
                      <p className="shrink-0 text-2xl font-black text-emerald-500 tabular-nums">
                        ${formatCurrency(kpiSummary?.largest_income || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shared Balances */}
              <SharedBalancesCard filterMonth={filterMonth} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
