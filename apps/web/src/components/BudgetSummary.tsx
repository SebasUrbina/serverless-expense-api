'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, ChevronDown, ArrowRight, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { formatMoney as money } from '@/lib/utils';
import { useBudget } from '@/hooks/useBudget';
import { useAvailability } from '@/hooks/useAvailability';
import { BaseModal } from './ui/BaseModal';

const WARNING_RATIO = 0.8;

function BudgetBar({
  budget,
  spent,
  committed,
}: {
  budget: number;
  spent: number;
  committed: number;
}) {
  const used = spent + committed;
  const scale = Math.max(budget, used);
  const level =
    used > budget
      ? 'var(--color-expense)'
      : used >= budget * WARNING_RATIO
        ? 'var(--color-warning)'
        : 'var(--color-primary)';
  const segments = [
    { value: spent, color: level },
    {
      value: committed,
      color: `color-mix(in srgb, ${level} 45%, transparent)`,
    },
  ].filter((s) => s.value > 0);

  return (
    <div
      role="img"
      aria-label={`Gastado ${money(spent)} y reservado ${money(committed)} de un presupuesto de ${money(budget)}`}
      className="bg-primary/20 flex h-2 gap-0.5 overflow-hidden rounded-full"
    >
      {segments.map((s, i) => (
        <div
          key={i}
          className="h-full"
          style={{ width: `${(s.value / scale) * 100}%`, background: s.color }}
        />
      ))}
    </div>
  );
}

/** Budget progress shown inside the monthly summary card. */
export function HeroBudget({ month }: { month: string }) {
  const { data, isPending, isError, isFetching, refetch } =
    useAvailability(month);
  const [editing, setEditing] = useState(false);

  if (isPending)
    return (
      <p role="status" className="text-secondary mt-5 text-[13px]">
        Calculando tu disponible…
      </p>
    );
  if (!data || isError)
    return (
      <p role="alert" className="text-secondary mt-5 text-[13px]">
        No pudimos cargar tu presupuesto.{' '}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-primary focus-ring rounded-md font-semibold underline underline-offset-2 disabled:opacity-50"
        >
          Reintentar
        </button>
      </p>
    );

  const past = data.period === 'past';
  const deficit = data.available !== null && data.available < 0;
  const editor = (
    <BudgetEditModal
      month={month}
      budget={data.budget}
      isOpen={editing}
      onClose={() => setEditing(false)}
    />
  );

  if (!data.budget)
    return (
      <>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="bg-primary/15 hover:bg-primary/20 text-primary focus-ring mt-5 flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors"
        >
          <Pencil size={15} aria-hidden="true" />
          Definir presupuesto
        </button>
        {editor}
      </>
    );

  const available = money(Math.abs(data.available ?? 0));
  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Editar presupuesto de ${money(data.budget)}`}
        className="group/budget focus-ring -mx-2 mt-3 block w-[calc(100%+1rem)] rounded-xl px-2 py-2 text-left"
      >
        <BudgetBar
          budget={data.budget}
          spent={data.spent}
          committed={data.committed}
        />
        <span className="text-secondary mt-2 flex items-center gap-2 text-[13px] tabular-nums">
          <span className="min-w-0">
            <b
              className={`font-semibold ${deficit ? 'text-expense' : 'text-primary'}`}
            >
              {deficit ? 'Excedido en' : past ? 'Quedaron' : 'Te quedan'}{' '}
              {available}
            </b>{' '}
            de {money(data.budget)}
            {!past && !deficit && data.daily_available !== null && (
              <> · {money(data.daily_available)} por día</>
            )}
          </span>
          <Pencil
            size={13}
            aria-hidden="true"
            className="ml-auto shrink-0 opacity-70 transition-opacity group-hover/budget:opacity-100"
          />
        </span>
      </button>
      {editor}
    </>
  );
}

function BudgetEditModal({
  month,
  budget,
  isOpen,
  onClose,
}: {
  month: string;
  budget: number | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  // Portaled so the dialog doesn't inherit the hero card's colors.
  return createPortal(
    <BudgetEditForm month={month} budget={budget} onClose={onClose} />,
    document.body,
  );
}

function BudgetEditForm({
  month,
  budget,
  onClose,
}: {
  month: string;
  budget: number | null;
  onClose: () => void;
}) {
  const { saveBudget } = useBudget(month);
  const [draft, setDraft] = useState(budget === null ? '' : String(budget));
  const [saveError, setSaveError] = useState('');
  const monthLabel = format(parseISO(`${month}-01`), 'MMMM', { locale: es });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(draft);
    if (!draft.trim() || !Number.isSafeInteger(amount) || amount < 0) {
      setSaveError('Ingresa un monto válido en pesos, sin decimales.');
      return;
    }
    setSaveError('');
    try {
      await saveBudget.mutateAsync(amount);
      onClose();
    } catch {
      setSaveError('No se guardó el presupuesto. Intenta nuevamente.');
    }
  };

  return (
    <BaseModal
      isOpen
      label="Presupuesto del mes"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={save} className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-primary text-lg font-bold">
            Presupuesto de {monthLabel}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-muted hover:text-primary hover:bg-inset focus-ring -mt-1 -mr-2 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <label
          htmlFor="monthly-budget"
          className="text-secondary mt-4 mb-2 block text-sm font-semibold"
        >
          Monto en pesos (CLP)
        </label>
        <input
          id="monthly-budget"
          autoFocus
          inputMode="numeric"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.replace(/[^0-9]/g, ''));
            setSaveError('');
          }}
          disabled={saveBudget.isPending}
          aria-describedby={saveError ? 'budget-error' : undefined}
          className="bg-inset text-primary border-border min-h-12 w-full rounded-xl border px-3 text-base tabular-nums"
          placeholder="1200000"
        />
        {saveError && (
          <p
            id="budget-error"
            role="alert"
            className="text-expense mt-2 text-sm"
          >
            {saveError}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-inset text-primary hover:bg-card-hover focus-ring min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saveBudget.isPending}
            className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Check size={16} aria-hidden="true" />
            {saveBudget.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

/** Compact, expandable list of the month's upcoming payments. */
export function UpcomingPayments({ month }: { month: string }) {
  const { data } = useAvailability(month);
  const [showAll, setShowAll] = useState(false);

  if (!data || data.period === 'past' || data.payment_count === 0) return null;
  const payments = showAll ? data.payments : data.payments.slice(0, 5);
  const next = data.payments[0];

  return (
    <section
      aria-label="Próximos pagos"
      className="bg-card border-border min-w-0 rounded-3xl border shadow-sm"
    >
      <details className="group/payments">
        <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 rounded-3xl px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <h2 className="text-primary text-sm font-semibold">
              Próximos pagos
            </h2>
            <p className="text-secondary mt-0.5 truncate text-sm">
              {next &&
                `${format(parseISO(next.date), 'd MMM', { locale: es })} · ${next.title}`}
            </p>
          </div>
          {next && (
            <span className="text-primary shrink-0 text-sm font-semibold tabular-nums">
              {money(next.amount)}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            size={18}
            className="text-secondary shrink-0 transition-transform group-open/payments:rotate-180"
          />
        </summary>
        <div className="border-border border-t px-5 pt-4 pb-4 sm:px-6">
          <ul className="divide-border divide-y">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="text-primary text-sm font-semibold break-words">
                    {payment.title}
                  </p>
                  <p className="text-secondary mt-1 text-sm">
                    {format(parseISO(payment.date), 'd MMM', { locale: es })} ·{' '}
                    {payment.source === 'recurring'
                      ? 'Recurrente'
                      : 'Programado'}
                  </p>
                  {payment.date <= data.as_of && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      {payment.date === data.as_of
                        ? 'Previsto para hoy'
                        : 'Fecha pasada · pendiente de registro'}
                    </p>
                  )}
                </div>
                <p className="text-primary shrink-0 text-sm font-bold tabular-nums">
                  {money(payment.amount)}
                </p>
              </li>
            ))}
          </ul>
          {data.payment_count > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              aria-expanded={showAll}
              className="text-accent mt-3 min-h-11 text-sm font-semibold"
            >
              {showAll
                ? 'Mostrar menos'
                : `Ver los ${data.payment_count} pagos`}
            </button>
          )}
          <div className="border-border mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
            <span className="text-secondary">Total previsto del mes</span>
            <span className="text-primary font-bold tabular-nums">
              {money(data.committed)}
            </span>
          </div>
          <Link
            href="/recurring"
            className="text-secondary hover:text-primary mt-3 flex min-h-11 items-center justify-between gap-2 text-sm font-semibold"
          >
            Gestionar recurrentes
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </details>
    </section>
  );
}
