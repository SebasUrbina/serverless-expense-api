'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Pencil,
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
  const { data, isPending, isError, isFetching, refetch, dataUpdatedAt } =
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
        <div className="bg-inset mt-5 h-20 animate-pulse rounded-2xl" />
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
  const scale = Math.max(data.budget ?? 0, data.spent + data.committed, 1);
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
      aria-label="Plan del mes"
      className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <div className="bg-card border-border min-w-0 rounded-3xl border p-6 shadow-sm sm:p-8 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-accent-soft text-accent flex h-11 w-11 items-center justify-center rounded-2xl">
              <Wallet size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-primary text-base font-bold">
                {past ? 'Cierre del presupuesto' : 'Disponible real'}
              </h2>
              <p className="text-secondary text-sm">
                {future ? 'Plan para' : 'Presupuesto de'} {monthLabel}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="text-secondary hover:bg-inset flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
            >
              <Pencil size={15} aria-hidden="true" />
              {data.budget === null
                ? 'Definir presupuesto'
                : 'Editar presupuesto'}
            </button>
          )}
        </div>

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

        <div className="my-7" aria-live="polite">
          {data.available === null ? (
            <>
              <p className="text-primary text-2xl font-bold">
                Dale un límite a tu mes
              </p>
              <p className="text-secondary mt-2 text-base">
                Define tu presupuesto para saber cuánto queda después de tus
                compromisos.
              </p>
            </>
          ) : (
            <>
              <p
                className={`text-4xl font-bold tracking-tight break-words tabular-nums sm:text-5xl ${deficit ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}
              >
                {money(data.available)}
              </p>
              <p className="text-secondary mt-2 text-base">
                {deficit
                  ? 'Tus gastos y compromisos superan el presupuesto.'
                  : past
                    ? 'Quedó sin utilizar al cerrar el mes.'
                    : 'Después de lo gastado y los pagos previstos.'}
              </p>
            </>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Presupuesto', value: data.budget, color: 'text-primary' },
            {
              label: 'Gastado a la fecha',
              value: data.spent,
              color: 'text-primary',
            },
            {
              label: 'Pagos previstos',
              value: data.committed,
              color: 'text-amber-700 dark:text-amber-400',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-inset flex items-center justify-between gap-2 rounded-xl px-3 py-3 sm:block"
            >
              <dt className="text-secondary text-sm">{item.label}</dt>
              <dd
                className={`text-base font-bold break-words tabular-nums sm:mt-1 ${item.color}`}
              >
                {item.value === null ? 'Sin definir' : money(item.value)}
              </dd>
            </div>
          ))}
        </dl>
        {data.budget !== null && (
          <>
            <div
              aria-hidden="true"
              className="bg-accent-soft mt-4 flex h-2 overflow-hidden rounded-full"
            >
              <div
                className="bg-slate-500"
                style={{ width: `${(Math.max(0, data.spent) / scale) * 100}%` }}
              />
              <div
                className="bg-amber-500"
                style={{
                  width: `${(Math.max(0, data.committed) / scale) * 100}%`,
                }}
              />
            </div>
            {!past && (
              <div className="border-border mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t pt-5">
                <p className="text-secondary text-sm">
                  Disponible por día · {data.remaining_days} días
                  {future ? '' : ', incluido hoy'}
                </p>
                <p className="text-primary text-2xl font-bold tabular-nums">
                  {money(data.daily_available ?? 0)}
                </p>
              </div>
            )}
          </>
        )}
        <details className="text-secondary mt-4 text-sm">
          <summary className="cursor-pointer py-2">Cómo se calcula</summary>
          <p className="mt-1 leading-relaxed">
            Presupuesto menos gastos registrados hasta hoy y pagos previstos del
            mes. Incluye el monto completo de los gastos que registraste,
            también los compartidos. No suma ingresos futuros ni reembolsos
            esperados. Las fechas no confirman un pago bancario.
          </p>
          <p className="mt-2 leading-relaxed">
            Los recurrentes se estiman desde su próxima fecha y las cuotas
            futuras se cuentan una sola vez. Un pago manual sin vínculo con su
            regla recurrente puede contarse por separado.
          </p>
        </details>
        <p className="text-secondary mt-2 text-xs">
          Actualizado a las {format(new Date(dataUpdatedAt), 'HH:mm')} · según
          tus registros
        </p>
      </div>

      <div className="bg-card border-border min-w-0 rounded-3xl border p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <CalendarDays
            size={21}
            className="text-secondary"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-primary text-base font-bold">
              {past ? 'Pagos del período' : 'Próximos pagos'}
            </h2>
            <p className="text-secondary text-sm">
              {past
                ? 'Mes cerrado'
                : `${data.payment_count} previstos en ${monthLabel}`}
            </p>
          </div>
        </div>
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
        )}
        {data.payment_count > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="text-accent mt-3 min-h-11 text-sm font-semibold"
          >
            {showAll ? 'Mostrar menos' : `Ver los ${data.payment_count} pagos`}
          </button>
        )}
        <Link
          href="/recurring"
          className="text-secondary hover:text-primary mt-5 flex min-h-11 items-center justify-between gap-2 text-sm font-semibold"
        >
          Gestionar gastos fijos
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
