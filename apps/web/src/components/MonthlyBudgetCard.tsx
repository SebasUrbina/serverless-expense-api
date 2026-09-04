'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Pencil,
  ChevronDown,
  Wallet,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { useBudget } from '@/hooks/useBudget';
import { useAvailability } from '@/hooks/useAvailability';

const money = (value: number) =>
  `${value < 0 ? '−' : ''}$${formatCurrency(Math.abs(value))}`;

export function MonthlyBudgetCard({ month }: { month: string }) {
  const { data, isPending, isError, isFetching, refetch } =
    useAvailability(month);
  const { saveBudget } = useBudget(month);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (isPending)
    return (
      <div
        role="status"
        className="bg-card border-border rounded-3xl border p-6"
      >
        <p className="text-secondary text-sm">
          Calculando tu disponible y próximos pagos…
        </p>
      </div>
    );
  if (!data || isError)
    return (
      <div
        role="alert"
        className="bg-card border-border rounded-3xl border p-6"
      >
        <p className="text-primary font-semibold">
          No pudimos actualizar tu disponible.
        </p>
        <p className="text-secondary mt-1 text-sm">
          Revisa tu conexión e intenta nuevamente.
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-accent mt-3 min-h-11 text-sm font-semibold disabled:opacity-50"
        >
          Reintentar
        </button>
      </div>
    );

  const past = data.period === 'past';
  const future = data.period === 'future';
  const deficit = data.available !== null && data.available < 0;
  const payments = showAll ? data.payments : data.payments.slice(0, 5);
  const monthLabel = format(parseISO(`${month}-01`), 'MMMM', { locale: es });

  const startEditing = () => {
    setDraft(data.budget === null ? '' : String(data.budget));
    setSaveError('');
    setEditing(true);
  };

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
      setEditing(false);
    } catch {
      setSaveError('No se guardó el presupuesto. Intenta nuevamente.');
    }
  };

  return (
    <section
      aria-label="Presupuesto y próximos pagos"
      className="bg-card border-border min-w-0 rounded-3xl border shadow-sm"
    >
      <details className="group/budget">
        <summary className="text-primary block cursor-pointer list-none rounded-3xl px-5 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <span className="bg-accent-soft text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <Wallet size={20} aria-hidden="true" />
            </span>
            <h2 className="text-primary text-base font-bold">
              {past ? 'Cierre del presupuesto' : 'Tu presupuesto'}
            </h2>
            <ChevronDown
              aria-hidden="true"
              size={18}
              className="text-secondary ml-auto shrink-0 transition-transform group-open/budget:rotate-180"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-secondary text-sm">
                {data.available === null
                  ? 'Organiza tu mes'
                  : deficit
                    ? 'Excedido en'
                    : past
                      ? 'Quedaron'
                      : 'Te quedan'}
              </p>
              <p
                className={`mt-1 text-2xl font-bold break-words tabular-nums ${deficit ? 'text-red-600 dark:text-red-400' : data.available === null ? 'text-primary' : 'text-emerald-700 dark:text-emerald-400'}`}
              >
                {data.available === null
                  ? 'Definir presupuesto'
                  : money(Math.abs(data.available))}
              </p>
            </div>
            {!past && data.daily_available !== null && (
              <div className="shrink-0 text-right">
                <p className="text-primary text-base font-bold tabular-nums">
                  {money(data.daily_available)}
                </p>
                <p className="text-secondary mt-1 text-sm">por día</p>
              </div>
            )}
          </div>
        </summary>
        <div className="border-border border-t px-5 pt-4 pb-4">
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Presupuesto del mes', value: data.budget },
              { label: 'Gastado', value: data.spent },
              { label: 'Reservado para pagos', value: data.committed },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-wrap justify-between gap-2"
              >
                <dt className="text-secondary">{item.label}</dt>
                <dd className="text-primary font-semibold tabular-nums">
                  {item.value === null ? 'Sin definir' : money(item.value)}
                </dd>
              </div>
            ))}
          </dl>
          {!past && (
            <p className="text-secondary mt-3 text-sm">
              {data.remaining_days} días restantes
              {future ? '' : ', incluido hoy'}
            </p>
          )}
          {!editing && (
            <button
              onClick={startEditing}
              className="text-accent mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold"
            >
              <Pencil size={15} aria-hidden="true" />
              {data.budget === null
                ? 'Definir presupuesto'
                : 'Editar presupuesto'}
            </button>
          )}
          {editing && (
            <form onSubmit={save} className="bg-inset mt-5 rounded-2xl p-4">
              <label
                htmlFor="monthly-budget"
                className="text-primary mb-2 block text-sm font-semibold"
              >
                Presupuesto de {monthLabel} (CLP)
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="monthly-budget"
                  autoFocus
                  inputMode="numeric"
                  value={draft}
                  onChange={(e) =>
                    setDraft(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  disabled={saveBudget.isPending}
                  aria-describedby={saveError ? 'budget-error' : undefined}
                  className="bg-card text-primary border-border min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-base"
                  placeholder="Ej. 1200000"
                />
                <button
                  type="submit"
                  disabled={saveBudget.isPending}
                  className="bg-accent-soft text-primary border-border flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-50"
                >
                  <Check size={16} />
                  {saveBudget.isPending ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  type="button"
                  aria-label="Cancelar edición"
                  disabled={saveBudget.isPending}
                  onClick={() => setEditing(false)}
                  className="text-secondary flex h-11 w-11 items-center justify-center rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
              {saveError && (
                <p
                  id="budget-error"
                  role="alert"
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {saveError}
                </p>
              )}
            </form>
          )}
        </div>
      </details>
      {!past && (
        <details className="group/payments border-border border-t">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-b-3xl px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 [&::-webkit-details-marker]:hidden">
            <CalendarDays
              size={18}
              className="text-secondary shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-primary text-sm font-semibold">
                Próximos pagos
              </h2>
              <p className="text-secondary mt-0.5 truncate text-sm">
                {data.payments[0]
                  ? `${format(parseISO(data.payments[0].date), 'd MMM', { locale: es })} · ${data.payments[0].title}`
                  : 'Sin pagos previstos'}
              </p>
            </div>
            {data.payment_count > 0 && (
              <span className="text-primary shrink-0 text-sm font-semibold tabular-nums">
                {money(data.payments[0]?.amount ?? 0)}
              </span>
            )}
            <ChevronDown
              aria-hidden="true"
              size={18}
              className="text-secondary shrink-0 transition-transform group-open/payments:rotate-180"
            />
          </summary>
          <div className="border-border border-t px-5 pt-4 pb-4">
            {payments.length === 0 ? (
              <div className="bg-inset rounded-2xl p-5">
                <p className="text-primary text-base font-semibold">
                  {past
                    ? 'Sin pagos futuros en este período'
                    : 'Sin pagos previstos este mes'}
                </p>
                <p className="text-secondary mt-2 text-sm">
                  {past
                    ? 'El cierre usa únicamente gastos registrados.'
                    : 'Aquí aparecerán tus cuotas futuras y gastos recurrentes.'}
                </p>
              </div>
            ) : (
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
                        {format(parseISO(payment.date), 'd MMM', {
                          locale: es,
                        })}{' '}
                        ·{' '}
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
            )}
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

            {data.payment_count > 0 && (
              <div className="border-border mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
                <span className="text-secondary">Total previsto del mes</span>
                <span className="text-primary font-bold tabular-nums">
                  {money(data.committed)}
                </span>
              </div>
            )}
            <Link
              href="/recurring"
              className="text-secondary hover:text-primary mt-3 flex min-h-11 items-center justify-between gap-2 text-sm font-semibold"
            >
              Gestionar gastos fijos
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </details>
      )}
    </section>
  );
}
