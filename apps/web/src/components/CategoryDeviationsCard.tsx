'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/utils';
import type { CategoryDeviation } from '@/lib/analytics';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import { useCategoryDetail } from '@/store/useCategoryDetail';
import { Card, CardHeader, CardNotice } from './ui/Card';

const VISIBLE_COUNT = 6;

export function CategoryDeviationsCard({
  deviations,
  month,
  inProgress,
  monthsCompared,
}: {
  deviations: CategoryDeviation[];
  month: string;
  inProgress: boolean;
  monthsCompared: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const categoryColors = useCategoryColors();
  const openDetail = useCategoryDetail((s) => s.open);
  const visible = showAll ? deviations : deviations.slice(0, VISIBLE_COUNT);
  const maxDelta = Math.max(...deviations.map((d) => Math.abs(d.delta)), 1);

  return (
    <Card label="Dónde te desviaste" className="h-full">
      <CardHeader
        title="Dónde te desviaste"
        description={
          monthsCompared === 0
            ? undefined
            : inProgress
              ? 'Lo que llevas este mes contra lo que sueles llevar a esta altura.'
              : `Contra tu promedio de ${monthsCompared === 1 ? 'el mes anterior' : `los ${monthsCompared} meses anteriores`}.`
        }
      />
      {deviations.length === 0 ? (
        <CardNotice
          className="mt-5"
          title="Aún no hay meses para comparar"
          description="Cuando tengas gastos en más de un mes, aquí verás qué categorías se salen de lo habitual."
        />
      ) : (
        <>
          <ul className="divide-border mt-3 divide-y">
            {visible.map((d) => {
              const above = d.delta > 0;
              const width = `${(Math.abs(d.delta) / maxDelta) * 50}%`;
              const color =
                categoryColors.get(d.categoryId) ?? 'var(--text-muted)';
              return (
                <li key={d.categoryId}>
                  <button
                    type="button"
                    onClick={() => openDetail(d.categoryId, month)}
                    className="hover:bg-inset focus-ring -mx-2 grid min-h-14 w-[calc(100%+1rem)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl px-2 py-2.5 text-left transition-colors sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]"
                  >
                    <span className="order-1 min-w-0">
                      <span className="text-primary block truncate text-sm font-semibold">
                        {d.icon ? `${d.icon} ` : ''}
                        {d.category}
                      </span>
                      <span className="text-muted mt-0.5 block truncate text-xs tabular-nums">
                        {formatMoney(d.amount)} · promedio{' '}
                        {formatMoney(d.average)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="before:bg-border relative order-3 col-span-2 h-2 before:absolute before:inset-y-[-4px] before:left-1/2 before:w-px sm:order-2 sm:col-span-1"
                    >
                      <span
                        className="absolute inset-y-0 rounded-[3px]"
                        style={{
                          background: color,
                          width,
                          ...(above ? { left: '50%' } : { right: '50%' }),
                        }}
                      />
                    </span>
                    <span
                      className={`order-2 text-right text-sm font-semibold tabular-nums sm:order-3 ${above ? 'text-expense' : 'text-income'}`}
                    >
                      {above ? '+' : '−'}
                      {formatMoney(Math.abs(d.delta))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {deviations.length > VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((open) => !open)}
              aria-expanded={showAll}
              className="text-secondary hover:text-primary focus-ring mt-2 min-h-11 rounded-md text-sm font-semibold"
            >
              {showAll
                ? 'Mostrar menos'
                : `Ver las ${deviations.length} categorías`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
