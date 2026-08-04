'use client';

import { useState } from 'react';
import { Gauge, Pencil, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useBudget } from '@/hooks/useBudget';
import { parseISO, isValid, format } from 'date-fns';

type Props = {
  month: string;
  expense: number;
};

export function MonthlyBudgetCard({ month, expense }: Props) {
  const { general, isLoading, saveBudget } = useBudget(month);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');

  const budgetAmount = general?.amount ?? 0;
  const formatter = new Intl.NumberFormat('es-CL');

  const daysInMonth = month
    ? new Date(
        Number(month.split('-')[0]),
        Number(month.split('-')[1]),
        0,
      ).getDate()
    : 30;

  const monthDate = parseISO(`${month}-01`);
  const isCurrentMonth =
    isValid(monthDate) && format(new Date(), 'yyyy-MM') === month;
  const today = new Date();
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

  const percent = budgetAmount > 0 ? (expense / budgetAmount) * 100 : 0;
  const dailyAvg = daysElapsed > 0 ? expense / daysElapsed : 0;
  const remainingDays = Math.max(0, daysInMonth - daysElapsed);
  const projected = expense + dailyAvg * remainingDays;
  const projectedPercent =
    budgetAmount > 0 ? (projected / budgetAmount) * 100 : 0;

  const percentColor =
    percent < 70
      ? 'bg-emerald-500'
      : percent < 90
        ? 'bg-amber-500'
        : 'bg-red-500';
  const textColor =
    percent < 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : percent < 90
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const startEdit = () => {
    setDraft(budgetAmount > 0 ? formatter.format(budgetAmount) : '');
    setEditing(true);
  };
  const commit = () => {
    const value = Number(draft.replace(/[^0-9]/g, ''));
    if (!isNaN(value) && value >= 0) saveBudget.mutate(value);
    setEditing(false);
  };

  return (
    <div className="bg-card border-border rounded-3xl border p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-2xl">
            <Gauge size={20} />
          </div>
          <div>
            <p className="text-primary text-base font-bold">Ritmo del mes</p>
            <p className="text-muted mt-0.5 text-xs">
              Presupuesto vs. lo que llevas gastado
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="bg-inset h-4 w-1/3 rounded-lg" />
          <div className="bg-inset h-2.5 w-full rounded-full" />
          <div className="bg-inset h-3 w-2/3 rounded-lg" />
        </div>
      ) : budgetAmount === 0 && !editing ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-muted text-sm">
            Aún no tienes un presupuesto para este mes.
          </p>
          <button
            onClick={startEdit}
            className="text-accent bg-accent-soft hover:bg-accent/20 mt-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Pencil size={14} /> Establecer presupuesto
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-muted text-sm">
                Gastado{' '}
                <span className="text-primary font-bold tabular-nums">
                  ${formatCurrency(expense)}
                </span>
              </p>
            </div>
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    if (!rawValue) {
                      setDraft('');
                      return;
                    }
                    setDraft(formatter.format(parseInt(rawValue, 10)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  inputMode="numeric"
                  className="text-primary bg-inset border-border focus:border-accent w-32 rounded-lg border px-2.5 py-1.5 text-right text-base font-bold tabular-nums outline-none"
                  placeholder="Monto"
                />
                <button
                  onClick={commit}
                  className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg text-white"
                  aria-label="Guardar"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-inset text-secondary flex h-8 w-8 items-center justify-center rounded-lg"
                  aria-label="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEdit}
                className="text-accent flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              >
                <Pencil size={13} />
                <span className="tabular-nums">
                  ${formatCurrency(budgetAmount)}
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="bg-inset h-2.5 flex-1 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-700 ${percentColor}`}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            <span className={`text-sm font-black tabular-nums ${textColor}`}>
              {percent.toFixed(0)}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-inset/60 border-border-subtle rounded-xl border px-3 py-2.5">
              <p className="text-muted text-[10px] font-bold tracking-wider uppercase">
                Proyección fin de mes
              </p>
              <p
                className={`mt-0.5 text-sm font-black tabular-nums ${
                  projectedPercent > 100
                    ? 'text-red-600 dark:text-red-400'
                    : projectedPercent > 90
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                ${formatCurrency(projected)}
              </p>
              <p className="text-muted mt-0.5 text-[11px]">
                {projectedPercent.toFixed(0)}% del presupuesto
              </p>
            </div>
            <div className="bg-inset/60 border-border-subtle rounded-xl border px-3 py-2.5">
              <p className="text-muted text-[10px] font-bold tracking-wider uppercase">
                Presupuesto diario
              </p>
              <p className="text-primary mt-0.5 text-sm font-black tabular-nums">
                ${formatCurrency(dailyAvg)}
              </p>
              <p className="text-muted mt-0.5 text-[11px]">
                {remainingDays} días restantes
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
