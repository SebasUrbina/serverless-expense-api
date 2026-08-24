'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
import { useState, useEffect } from 'react';
import type { RecurringRule, RecurringRulesResponse } from '@/types/api';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';

const frequencyLabel: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

const frequencyColors: Record<string, string> = {
  daily: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  weekly: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  monthly: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yearly: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function RecurringPage() {
  const { openModal } = useRecurringModal();
  const queryClient = useQueryClient();
  const [fabMounted, setFabMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFabMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const { data: response, isLoading } = useQuery<RecurringRulesResponse>({
    queryKey: queryKeys.recurring.list,
    queryFn: async () => {
      const res = await api.get('/recurring');
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: number;
      is_active: number;
    }) => {
      const res = await api.put(`/recurring/${id}`, { is_active });
      return res.data;
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring.list });

      const previousData =
        queryClient.getQueryData<RecurringRulesResponse>(
          queryKeys.recurring.list,
        );

      if (previousData) {
        queryClient.setQueryData<RecurringRulesResponse>(
          queryKeys.recurring.list,
          {
            ...previousData,
            rules: previousData.rules.map((rule) =>
              rule.id === id ? { ...rule, is_active } : rule,
            ),
          },
        );
      }

      return { previousData };
    },
    onError: (_err, _newRule, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.recurring.list,
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.list });
    },
  });

  const rules = response?.rules || [];
  const activeRules = rules.filter((r) => r.is_active === 1);
  const inactiveRules = rules.filter((r) => r.is_active !== 1);

  const totalMonthlyExpenses = activeRules
    .filter((r) => r.type === 'expense' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMonthlyIncome = activeRules
    .filter((r) => r.type === 'income' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

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
                {activeRules.length} activos
              </span>
            </div>
            {totalMonthlyExpenses > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-1.5">
                <TrendingDown size={13} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">
                  −${formatCurrency(totalMonthlyExpenses)}/mes
                </span>
              </div>
            )}
            {totalMonthlyIncome > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  +${formatCurrency(totalMonthlyIncome)}/mes
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
              {activeRules.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-secondary text-xs font-semibold tracking-wider uppercase">
                      Activos
                    </span>
                    <div className="bg-border h-px flex-1" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {activeRules.map((rule) => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onToggle={() =>
                          toggleMutation.mutate({
                            id: rule.id,
                            is_active: rule.is_active === 1 ? 0 : 1,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {inactiveRules.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                      Pausados
                    </span>
                    <div className="bg-border h-px flex-1" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 opacity-60 sm:grid-cols-2 xl:grid-cols-3">
                    {inactiveRules.map((rule) => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onToggle={() =>
                          toggleMutation.mutate({
                            id: rule.id,
                            is_active: rule.is_active === 1 ? 0 : 1,
                          })
                        }
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
          onClick={() => openModal()}
          className={`group bg-accent shadow-accent/30 fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl transition-all duration-300 hover:bg-emerald-600 active:scale-90 sm:hidden ${
            fabMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
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
  onToggle,
}: {
  rule: RecurringRule;
  onToggle: () => void;
}) {
  const isIncome = rule.type === 'income';
  const freqColor =
    frequencyColors[rule.frequency] ||
    'bg-zinc-800 text-zinc-400 border-zinc-700';
  const { openModal } = useRecurringModal();

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
          onClick={() => openModal(rule)}
          className="bg-inset border-border text-secondary hover:text-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
          aria-label={`Editar regla ${rule.title}`}
        >
          <Pencil size={13} />
        </button>

        {/* Toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={rule.is_active === 1 ? 'Pausar' : 'Activar'}
          role="switch"
          aria-checked={rule.is_active === 1}
          aria-label={`${rule.is_active === 1 ? 'Pausar' : 'Activar'} regla ${rule.title}`}
          className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300 ease-out ${
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
