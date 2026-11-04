'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
} from 'recharts';
import api from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { useCategoryDetail } from '@/store/useCategoryDetail';
import { useTransactionModal } from '@/store/useTransactionModal';
import { usePendingDeleteIds } from '@/store/usePendingDeletes';
import { useCategories } from '@/hooks/usePreferences';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import type { CategoryTrendResponse, Transaction } from '@/types/api';
import { BaseModal } from './ui/BaseModal';
import { LoadingState } from './ui/LoadingSpinner';
import { CardNotice } from './ui/Card';
import { TransactionRow } from './TransactionRow';

const WINDOW_MONTHS = 12;
const RECENT_COUNT = 5;

/** A category's last 12 months and this month's movements, in a sheet. */
export function CategoryDetailSheet() {
  const { categoryId, month, close } = useCategoryDetail();
  if (categoryId === null) return null;
  return (
    <CategoryDetail categoryId={categoryId} month={month} onClose={close} />
  );
}

function CategoryDetail({
  categoryId,
  month,
  onClose,
}: {
  categoryId: number;
  month: string;
  onClose: () => void;
}) {
  const { openModal } = useTransactionModal();
  const hidden = usePendingDeleteIds();
  const { data: categoriesData } = useCategories();
  const category = categoriesData?.categories.find((c) => c.id === categoryId);
  const color = useCategoryColors().get(categoryId) ?? 'var(--text-muted)';
  const monthDate = parseISO(`${month}-01`);
  const monthName = isValid(monthDate)
    ? format(monthDate, 'MMMM', { locale: es })
    : '';

  // Same key as the analytics page, so an open analytics view is reused.
  const { data: trend, isLoading: loadingTrend } =
    useQuery<CategoryTrendResponse>({
      queryKey: ['transactions', 'analytics', 'category-trend', month, ''],
      queryFn: async () =>
        (
          await api.get(
            `/transactions/summary/category-trend?months=${WINDOW_MONTHS}&endMonth=${month}`,
          )
        ).data,
    });

  const { data: list, isLoading: loadingList } = useQuery<{
    transactions: Transaction[];
  }>({
    queryKey: ['transactions', 'category-detail', categoryId, month],
    queryFn: async () => {
      const params = new URLSearchParams({
        category_id: String(categoryId),
        startDate: `${month}-01`,
        endDate: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
        limit: String(RECENT_COUNT),
      });
      return (await api.get(`/transactions?${params}`)).data;
    },
  });

  const values =
    trend?.categories.find((c) => c.category_id === categoryId)?.values ??
    trend?.months.map(() => 0) ??
    [];
  const months = trend?.months ?? [];
  const idx = months.indexOf(month);
  const amount = idx >= 0 ? (values[idx] ?? 0) : 0;
  const earlier = values.slice(0, Math.max(idx, 0)).filter((v) => v > 0);
  const average =
    earlier.length > 0
      ? earlier.reduce((sum, v) => sum + v, 0) / earlier.length
      : null;
  const delta = average === null ? null : Math.round(amount - average);
  const chartData = months.map((m, i) => ({
    month: m,
    name: format(parseISO(`${m}-01`), 'MMM', { locale: es }).replace('.', ''),
    value: values[i] ?? 0,
  }));
  const movements = (list?.transactions ?? []).filter(
    (tx) => !hidden.has(tx.id),
  );
  const label = category?.name ?? 'Categoría';

  return (
    <BaseModal isOpen label={`Detalle de ${label}`} onClose={onClose} draggable>
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
            style={{
              background: `color-mix(in srgb, ${color} 18%, transparent)`,
            }}
          >
            {category?.icon || '🏷️'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-primary truncate text-lg font-bold">{label}</h2>
            <p className="text-secondary text-[13px] capitalize">{monthName}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-muted hover:text-primary hover:bg-inset focus-ring -mt-1 -mr-2 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loadingTrend ? (
          <LoadingState minHeight="h-40" />
        ) : (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-secondary text-[13px]">Este mes</dt>
                <dd className="text-primary text-2xl font-extrabold tracking-tight tabular-nums">
                  {formatMoney(amount)}
                </dd>
              </div>
              <div>
                <dt className="text-secondary text-[13px]">Tu promedio</dt>
                <dd className="text-primary text-2xl font-extrabold tracking-tight tabular-nums">
                  {average === null ? '—' : formatMoney(average)}
                </dd>
                {delta !== null && delta !== 0 && (
                  <dd
                    className={`mt-0.5 text-xs font-semibold tabular-nums ${delta > 0 ? 'text-expense' : 'text-income'}`}
                  >
                    {delta > 0 ? '▲' : '▼'} {formatMoney(Math.abs(delta))}{' '}
                    {delta > 0 ? 'sobre' : 'bajo'} lo habitual
                  </dd>
                )}
              </div>
            </dl>

            {chartData.length > 1 && (
              <div
                role="img"
                aria-label={`Gasto en ${label} en los últimos ${chartData.length} meses`}
                className="mt-4 h-32 [&_*:focus]:outline-none"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    accessibilityLayer={false}
                    margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      dy={6}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {chartData.map((d) => (
                        <Cell
                          key={d.month}
                          fill={
                            d.month === month
                              ? color
                              : `color-mix(in srgb, ${color} 35%, transparent)`
                          }
                        />
                      ))}
                    </Bar>
                    {average !== null && (
                      <ReferenceLine
                        y={average}
                        stroke="var(--text-secondary)"
                        strokeDasharray="4 4"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        <h3 className="text-primary mt-6 text-sm font-bold">
          Movimientos de {monthName}
        </h3>
        {loadingList ? (
          <LoadingState minHeight="h-24" />
        ) : movements.length === 0 ? (
          <CardNotice
            className="mt-3"
            title="Sin movimientos este mes"
            description="Los gastos de esta categoría aparecerán aquí."
          />
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {movements.map((tx) => (
              <li key={tx.id} className="py-0.5">
                <TransactionRow
                  transaction={tx}
                  showDate
                  onSelect={
                    tx.is_owner === false
                      ? undefined
                      : (selected) => {
                          onClose();
                          openModal(selected);
                        }
                  }
                />
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/transactions?category_id=${categoryId}&month=${month}`}
          onClick={onClose}
          className="bg-inset text-primary hover:bg-border focus-ring mt-4 flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors"
        >
          Ver todos los movimientos
        </Link>
      </div>
    </BaseModal>
  );
}
