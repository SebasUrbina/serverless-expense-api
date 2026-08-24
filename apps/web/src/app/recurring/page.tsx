'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Pencil,
  Plus,
  Calendar,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useRecurringModal } from '@/store/useRecurringModal';
import type { RecurringRule } from '@/types/api';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { useRecurringRules } from '@/features/recurring/hooks/useRecurringRules';
import { summarizeRecurringRules } from '@/features/recurring/model/recurring';

const frequencyLabel: Record<RecurringRule['frequency'], string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

const frequencyColors: Record<RecurringRule['frequency'], string> = {
  daily: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  weekly: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  monthly: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yearly: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function RecurringPage() {
  const { openModal } = useRecurringModal();
  const { rules, isLoading, toggleRule, togglingRuleId, toggleError } =
    useRecurringRules();
  const { active, inactive, monthlyExpenses, monthlyIncome } =
    summarizeRecurringRules(rules);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <PageHeader
        title="Gastos fijos"
        subtitle="Lo que sale automáticamente cada mes."
        primaryAction={{
          label: 'Nueva regla',
          icon: <Plus size={16} />,
          onClick: () => openModal(),
        }}
      >
        {/* Summary Pills */}
        {rules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="bg-card border-border flex items-center gap-1.5 rounded-xl border px-3 py-1.5">
              <Zap size={13} className="text-emerald-400" />
              <span className="text-secondary text-xs font-medium">
                {active.length} activos
              </span>
            </div>
            {monthlyExpenses > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-1.5">
                <TrendingDown size={13} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">
                  −${formatCurrency(monthlyExpenses)}/mes
                </span>
              </div>
            )}
            {monthlyIncome > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  +${formatCurrency(monthlyIncome)}/mes
                </span>
              </div>
            )}
          </div>
        )}
      </PageHeader>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <LoadingState minHeight="h-48" />
          ) : rules.length === 0 ? (
            <EmptyState
              icon={<Repeat className="h-9 w-9" />}
              secondaryIcon={<Sparkles size={14} className="text-white" />}
              title="Automatiza tus finanzas"
              description="Agrega tus suscripciones y pagos recurrentes para que se registren automáticamente cada mes."
              actionButton={
                <AnimatedButton
                  text="Crear primera regla"
                  onClick={() => openModal()}
                />
              }
              primaryColor="emerald"
            />
          ) : (
            <div className="space-y-6">
              {toggleError && (
                <p role="alert" className="text-sm text-red-400">
                  No se pudo actualizar la regla. Intenta nuevamente.
                </p>
              )}
              {active.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
                      Activos
                    </span>
                    <div className="bg-border h-px flex-1" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {active.map((rule) => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onEdit={() => openModal(rule)}
                        onToggle={() =>
                          toggleRule(rule.id, rule.is_active === 1 ? 0 : 1)
                        }
                        isToggling={togglingRuleId === rule.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {inactive.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                      Pausados
                    </span>
                    <div className="bg-border h-px flex-1" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 opacity-60 sm:grid-cols-2 xl:grid-cols-3">
                    {inactive.map((rule) => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onEdit={() => openModal(rule)}
                        onToggle={() =>
                          toggleRule(rule.id, rule.is_active === 1 ? 0 : 1)
                        }
                        isToggling={togglingRuleId === rule.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile FAB — Only when rules exist ── */}
      {rules.length > 0 && (
        <button
          type="button"
          onClick={() => openModal()}
          className="group bg-accent shadow-accent/30 animate-in fade-in slide-in-from-bottom-4 fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl duration-300 hover:bg-emerald-600 active:scale-90 sm:hidden"
          style={{
            bottom: 'calc(5rem + env(safe-area-inset-bottom) + 0.75rem)',
          }}
          aria-label="Nueva regla recurrente"
        >
          <Plus
            size={24}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </button>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  onEdit,
  onToggle,
  isToggling,
}: {
  rule: RecurringRule;
  onEdit: () => void;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const isIncome = rule.type === 'income';
  const freqColor =
    frequencyColors[rule.frequency] ||
    'bg-zinc-800 text-zinc-400 border-zinc-700';

  return (
    <article className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-150">
      {/* Top Row */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            rule.category_icon
              ? 'bg-inset'
              : isIncome
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-red-500/10 text-red-500'
          }`}
        >
          {rule.category_icon ? (
            <span>{rule.category_icon}</span>
          ) : isIncome ? (
            <ArrowUpRight size={18} />
          ) : (
            <ArrowDownRight size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-primary truncate text-sm leading-tight font-semibold">
            {rule.title}
          </p>
          {rule.category && (
            <span className="bg-inset text-secondary border-border mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
              {rule.category}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="bg-inset border-border text-secondary hover:text-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
          aria-label={`Editar regla ${rule.title}`}
        >
          <Pencil size={13} />
        </button>

        {/* Toggle */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isToggling}
          title={rule.is_active === 1 ? 'Pausar' : 'Activar'}
          role="switch"
          aria-checked={rule.is_active === 1}
          aria-label={`${rule.is_active === 1 ? 'Pausar' : 'Activar'} regla ${rule.title}`}
          className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300 ease-out disabled:opacity-60 ${
            rule.is_active === 1 ? 'bg-emerald-500' : 'bg-zinc-600'
          }`}
        >
          <span
            className={`h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
              rule.is_active === 1 ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Amount + Frequency */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-2xl font-bold tracking-tight"
            style={{
              color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
            }}
          >
            {isIncome ? '+' : '−'}${formatCurrency(rule.amount)}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${freqColor}`}
            >
              <Repeat size={9} />
              {frequencyLabel[rule.frequency]}
              {rule.frequency === 'monthly' && rule.day_of_month
                ? ` · día ${rule.day_of_month}`
                : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Next Run */}
      <div className="bg-inset border-border flex items-center gap-2 rounded-xl border px-3 py-2">
        <Calendar size={12} className="text-muted shrink-0" />
        <span className="text-muted text-xs">Próxima ejecución</span>
        <span className="text-secondary ml-auto text-xs font-semibold">
          {format(parseISO(rule.next_run), "d 'de' MMM yyyy", { locale: es })}
        </span>
      </div>
    </article>
  );
}
