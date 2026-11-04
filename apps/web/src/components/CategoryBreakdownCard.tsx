'use client';

import { useId, useState } from 'react';
import { format, isValid, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { distinctCategoryColors, OTHERS_COLOR } from '@/lib/categoryColors';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import { useCategoryDetail } from '@/store/useCategoryDetail';
import type { CategorySummary } from '@/types/api';
import { Card, CardHeader, CardNotice } from './ui/Card';

const TOP_COUNT = 5;

type Row = {
  key: string;
  rank: string;
  title: string;
  subtitle: React.ReactNode;
  amount: number;
  pct: number;
  shade: string;
  categoryId: number | null;
  /** Grouped categories, shown when the row is expanded. */
  details?: Row[];
};

function Delta({ amount, previous }: { amount: number; previous?: number }) {
  if (previous === undefined) return null;
  if (previous === 0) return <>Nueva este mes</>;
  const delta = amount - previous;
  if (delta === 0) return <>Igual que el mes anterior</>;
  const up = delta > 0;
  return (
    <>
      <span className={`font-semibold ${up ? 'text-expense' : 'text-income'}`}>
        {up ? '▲' : '▼'} ${formatCurrency(Math.abs(delta))}
      </span>{' '}
      vs mes anterior
    </>
  );
}

export function CategoryBreakdownCard({
  categories,
  month,
  onAdd,
}: {
  categories: CategorySummary[];
  month: string;
  onAdd: () => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const othersId = useId();
  const categoryColors = useCategoryColors();
  const openDetail = useCategoryDetail((s) => s.open);

  const spent = categories
    .filter((cat) => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = spent.reduce((acc, cat) => acc + cat.amount, 0);
  const pctOf = (amount: number) =>
    total > 0 ? Math.round((amount / total) * 100) : 0;
  const top = spent.slice(0, TOP_COUNT);
  const rest = spent.slice(TOP_COUNT);
  const restAmount = rest.reduce((acc, cat) => acc + cat.amount, 0);

  const toRow = (cat: CategorySummary, i: number, shade: string): Row => ({
    key: String(cat.category_id),
    rank: String(i + 1).padStart(2, '0'),
    title: `${cat.category_icon ? `${cat.category_icon} ` : ''}${cat.category}`,
    subtitle: <Delta amount={cat.amount} previous={cat.previous_amount} />,
    amount: cat.amount,
    pct: pctOf(cat.amount),
    shade,
    categoryId: cat.category_id,
  });

  const topColors = distinctCategoryColors(
    top.map((cat) => cat.category_id),
    categoryColors,
  );
  const rows: Row[] = top.map((cat, i) =>
    toRow(cat, i, topColors[i] ?? OTHERS_COLOR),
  );
  if (rest.length === 1) {
    rows.push(toRow(rest[0]!, TOP_COUNT, OTHERS_COLOR));
  } else if (rest.length > 1) {
    rows.push({
      key: 'others',
      rank: '',
      title: `Otras ${rest.length} categorías`,
      subtitle: rest.map((cat) => cat.category).join(', '),
      amount: restAmount,
      pct: pctOf(restAmount),
      shade: OTHERS_COLOR,
      categoryId: null,
      details: rest.map((cat, i) => toRow(cat, TOP_COUNT + i, OTHERS_COLOR)),
    });
  }

  const leader = top[0];
  const previousMonth = month ? subMonths(parseISO(`${month}-01`), 1) : null;
  const previousMonthLabel =
    previousMonth && isValid(previousMonth)
      ? format(previousMonth, 'MMMM', { locale: es })
      : 'el mes anterior';
  const leaderDelta =
    leader && leader.previous_amount
      ? leader.amount - leader.previous_amount
      : 0;

  return (
    <Card label="En esto se va tu dinero" className="@container">
      <CardHeader title="En esto se va tu dinero" />

      {!leader ? (
        <CardNotice
          className="mt-5"
          title="Aún no registras gastos este mes"
          description="Cuando agregues uno, aquí verás qué categorías se llevan tu dinero."
          action={{ label: 'Agregar gasto', onClick: onAdd }}
        />
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-1 @lg:grid @lg:grid-cols-[minmax(0,1fr)_auto] @lg:items-end @lg:gap-x-6">
            <div className="min-w-0">
              <p className="text-primary truncate text-xl font-bold tracking-tight @lg:text-2xl">
                {leader.category_icon ? `${leader.category_icon} ` : ''}
                {leader.category}
              </p>
              <p className="text-secondary mt-0.5 text-[15px]">
                se lleva la mayor parte de tu gasto
              </p>
            </div>
            <p
              aria-label={`${pctOf(leader.amount)} por ciento`}
              className="text-primary mt-2 text-[52px] leading-[0.9] font-extrabold tracking-[-0.045em] tabular-nums @lg:row-start-1 @lg:mt-0 @lg:text-7xl"
            >
              {pctOf(leader.amount)}
              <span className="text-secondary ml-0.5 text-[0.5em] font-bold tracking-tight">
                %
              </span>
            </p>
          </div>

          <p className="text-secondary mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] tabular-nums">
            <span>
              <b className="text-primary font-semibold">
                ${formatCurrency(leader.amount)}
              </b>{' '}
              de ${formatCurrency(total)}
            </span>
            {leaderDelta !== 0 && (
              <span
                className={`font-semibold ${leaderDelta > 0 ? 'text-expense' : 'text-income'}`}
              >
                {leaderDelta > 0 ? '▲' : '▼'} $
                {formatCurrency(Math.abs(leaderDelta))} vs {previousMonthLabel}
              </span>
            )}
          </p>

          <div
            role="img"
            aria-label={`Composición del gasto: ${rows.map((r) => `${r.title} ${r.pct}%`).join(', ')}`}
            className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          >
            {rows.map((row, i) => (
              <div
                key={row.key}
                className="h-full motion-safe:transition-opacity motion-safe:duration-200"
                style={{
                  width: `${total > 0 ? (row.amount / total) * 100 : 0}%`,
                  background: row.shade,
                  opacity: active === null || active === i ? 1 : 0.22,
                }}
              />
            ))}
          </div>

          <ol className="divide-border mt-4 divide-y">
            {rows.map((row, i) => {
              const highlight = {
                onMouseEnter: () => setActive(i),
                onMouseLeave: () => setActive(null),
                onFocus: () => setActive(i),
                onBlur: () => setActive(null),
              };
              if (!row.details) {
                return (
                  <li key={row.key}>
                    <button
                      type="button"
                      onClick={() => openDetail(row.categoryId!, month)}
                      {...highlight}
                      className={`${rowClass} w-[calc(100%+1rem)] text-left`}
                    >
                      <RowContent row={row} />
                    </button>
                  </li>
                );
              }
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    aria-expanded={showOthers}
                    aria-controls={othersId}
                    onClick={() => setShowOthers((open) => !open)}
                    {...highlight}
                    className={`${rowClass} w-[calc(100%+1rem)] text-left`}
                  >
                    <RowContent
                      row={{
                        ...row,
                        subtitle: showOthers ? 'Ocultar detalle' : row.subtitle,
                      }}
                      rank={
                        <ChevronDown
                          size={14}
                          aria-hidden="true"
                          className={`text-muted motion-safe:transition-transform ${showOthers ? 'rotate-180' : ''}`}
                        />
                      }
                    />
                  </button>
                  {showOthers && (
                    <ul id={othersId} className="mb-2">
                      {row.details.map((detail) => (
                        <li key={detail.key}>
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(detail.categoryId!, month)
                            }
                            {...highlight}
                            className={`${rowClass} w-[calc(100%+1rem)] text-left`}
                          >
                            <RowContent row={detail} nested />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Card>
  );
}

const rowClass =
  'hover:bg-inset focus-ring -mx-2 grid min-h-13 grid-cols-[22px_10px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-3 transition-colors';

function RowContent({
  row,
  rank,
  nested = false,
}: {
  row: Row;
  rank?: React.ReactNode;
  nested?: boolean;
}) {
  return (
    <>
      <span className="text-muted flex text-xs tabular-nums">
        {rank ?? row.rank}
      </span>
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-[3px] ${nested ? 'opacity-0' : ''}`}
        style={{ background: row.shade }}
      />
      <span className="min-w-0">
        <span
          className={`text-primary block truncate text-sm ${nested ? 'font-medium' : 'font-semibold'}`}
        >
          {row.title}
        </span>
        <span className="text-muted mt-0.5 block truncate text-xs">
          {row.subtitle}
        </span>
      </span>
      <span className="text-right tabular-nums">
        <span
          className={`text-primary block text-sm ${nested ? 'font-medium' : 'font-semibold'}`}
        >
          ${formatCurrency(row.amount)}
        </span>
        <span className="text-muted mt-0.5 block text-xs">{row.pct}%</span>
      </span>
    </>
  );
}
