'use client';

import { useState } from 'react';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MonthSelector } from '@/components/MonthSelector';
import { CategoryBreakdownCard } from '@/components/CategoryBreakdownCard';
import { SharedBalancesCard } from '@/components/SharedBalancesCard';
import { HeroBudget, UpcomingPayments } from '@/components/BudgetSummary';
import { TransactionRow } from '@/components/TransactionRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTitle, PageSubtitle } from '@/components/ui/Text';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardNotice, CardStat } from '@/components/ui/Card';
import { formatCurrency, formatMoney } from '@/lib/utils';
import { useTransactionModal } from '@/store/useTransactionModal';
import {
  useDeletedTotals,
  usePendingDeleteIds,
} from '@/store/usePendingDeletes';
import { useAuth } from '@/lib/AuthProvider';

const RECENT_COUNT = 8;

export default function Home() {
  const { session } = useAuth();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const {
    recentTransactions,
    monthlySummary,
    categorySummary,
    kpiSummary,
    selectedMonthSummary,
    totalBalance: serverBalance,
    isLoading,
  } = useDashboardData(filterMonth);
  // Server totals still count movements whose deletion can be undone or is queued.
  const deleted = useDeletedTotals(filterMonth);
  const categories = categorySummary.map((cat) => ({
    ...cat,
    amount: cat.amount - (deleted.byCategory.get(cat.category_id) ?? 0),
  }));
  const { openModal } = useTransactionModal();
  const pendingDeletes = usePendingDeleteIds();
  const visibleRecent = recentTransactions.filter(
    (tx) => !pendingDeletes.has(tx.id),
  );

  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.display_name;
  const firstName =
    typeof displayName === 'string' ? displayName.split(' ')[0] : null;

  const monthDate = parseISO(`${filterMonth}-01`);
  const previousMonthDate = subMonths(monthDate, 1);
  const expense = (selectedMonthSummary?.total_expense ?? 0) - deleted.expense;
  const income = (selectedMonthSummary?.total_income ?? 0) - deleted.income;
  const totalBalance = serverBalance - deleted.income + deleted.expense;
  const transactionCount = Math.max(
    (kpiSummary?.transaction_count || 0) - deleted.count,
    0,
  );
  const prevExpense =
    monthlySummary.find((s) => s.month === format(previousMonthDate, 'yyyy-MM'))
      ?.total_expense ?? 0;
  const expenseDelta =
    prevExpense > 0
      ? Math.round(((expense - prevExpense) / prevExpense) * 100)
      : null;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title=""
        customTitle={
          <div>
            <PageTitle>
              {firstName ? (
                <>
                  <span className="hidden sm:inline">Hola, </span>
                  {firstName}
                </>
              ) : (
                'Mi resumen'
              )}
            </PageTitle>
            <PageSubtitle>Así va tu mes.</PageSubtitle>
          </div>
        }
        monthSelector={
          <MonthSelector
            value={filterMonth}
            onChange={setFilterMonth}
            allowAll={false}
            className="min-w-0"
          />
        }
        primaryAction={{
          label: 'Agregar',
          onClick: () => openModal(),
        }}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <LoadingState minHeight="h-64" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-2">
                <Card label="Resumen del mes" tone="hero">
                  <CardHeader
                    title={`Gastado en ${format(monthDate, 'MMMM', { locale: es })}`}
                    link={{
                      href: `/analytics?month=${filterMonth}`,
                      label: 'Ver análisis',
                    }}
                  />
                  <p className="text-primary mt-4 text-[44px] leading-[0.95] font-extrabold tracking-[-0.04em] tabular-nums sm:text-6xl">
                    <span className="text-secondary mr-0.5 text-[0.55em] font-bold tracking-tight">
                      $
                    </span>
                    {formatCurrency(expense)}
                  </p>
                  {expenseDelta !== null && (
                    <p className="text-secondary mt-3 text-[13px] tabular-nums">
                      {expenseDelta === 0 ? (
                        'Igual que'
                      ) : (
                        <>
                          <span
                            className={`font-semibold ${expenseDelta > 0 ? 'text-expense' : 'text-income'}`}
                          >
                            {expenseDelta > 0 ? '▲' : '▼'}{' '}
                            {Math.abs(expenseDelta)}%
                          </span>{' '}
                          vs
                        </>
                      )}{' '}
                      {format(previousMonthDate, 'MMMM', { locale: es })}
                    </p>
                  )}

                  <HeroBudget key={filterMonth} month={filterMonth} />

                  <dl className="border-border mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                    <CardStat label="Ingresos" className="text-income">
                      {formatMoney(income)}
                    </CardStat>
                    <CardStat
                      label="Neto del mes"
                      className={totalBalance < 0 ? 'text-expense' : ''}
                    >
                      {formatMoney(totalBalance)}
                    </CardStat>
                    <CardStat label="Movimientos">{transactionCount}</CardStat>
                  </dl>
                </Card>

                <UpcomingPayments key={filterMonth} month={filterMonth} />

                <CategoryBreakdownCard
                  categories={categories}
                  month={filterMonth}
                  onAdd={() => openModal()}
                />
              </div>

              <div className="min-w-0 space-y-4 sm:space-y-6">
                <Card label="Últimos movimientos">
                  <CardHeader
                    title="Últimos movimientos"
                    link={
                      visibleRecent.length > 0
                        ? {
                            href: `/transactions?month=${filterMonth}`,
                            label: 'Ver todos',
                          }
                        : undefined
                    }
                  />
                  {visibleRecent.length > 0 ? (
                    <ul className="divide-border mt-3 divide-y">
                      {visibleRecent.slice(0, RECENT_COUNT).map((tx) => (
                        <li key={tx.id} className="py-0.5">
                          <TransactionRow
                            transaction={tx}
                            showDate
                            onSelect={
                              tx.is_owner === false ? undefined : openModal
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <CardNotice
                      className="mt-5"
                      title="Aún no hay movimientos este mes"
                      description="Los gastos e ingresos que registres aparecerán aquí."
                    />
                  )}
                </Card>

                {!!(
                  kpiSummary.largest_expense || kpiSummary.largest_income
                ) && (
                  <Card label="Lo más grande del mes">
                    <CardHeader title="Lo más grande del mes" />
                    <ul className="divide-border mt-3 divide-y">
                      {!!kpiSummary.largest_expense && (
                        <Highlight
                          label="Gasto"
                          detail={kpiSummary.largest_expense_title}
                          amount={`−${formatMoney(kpiSummary.largest_expense)}`}
                        />
                      )}
                      {!!kpiSummary.largest_income && (
                        <Highlight
                          label="Ingreso"
                          amount={`+${formatMoney(kpiSummary.largest_income)}`}
                          className="text-income"
                        />
                      )}
                    </ul>
                  </Card>
                )}
              </div>

              <div className="min-w-0 lg:col-span-3">
                <SharedBalancesCard filterMonth={filterMonth} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({
  label,
  detail,
  amount,
  className = '',
}: {
  label: string;
  detail?: string | null;
  amount: string;
  className?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-secondary text-[13px]">{label}</p>
        {detail && (
          <p className="text-primary mt-0.5 truncate text-sm font-semibold">
            {detail}
          </p>
        )}
      </div>
      <p
        className={`shrink-0 text-lg font-bold tabular-nums ${className || 'text-primary'}`}
      >
        {amount}
      </p>
    </li>
  );
}
