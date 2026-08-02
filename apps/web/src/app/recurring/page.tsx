'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Repeat, Plus, Calendar, Zap, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useRecurringModal } from '@/store/useRecurringModal';
import { useState, useEffect } from 'react';
import type { RecurringRule, RecurringRulesResponse } from '@/types/api';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

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
    queryKey: ['recurring', 'list'],
    queryFn: async () => {
      const res = await api.get('/recurring');
      return res.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: number }) => {
      const res = await api.put(`/recurring/${id}`, { is_active });
      return res.data;
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ['recurring', 'list'] });

      const previousData = queryClient.getQueryData<RecurringRulesResponse>(['recurring', 'list']);

      if (previousData) {
        queryClient.setQueryData<RecurringRulesResponse>(['recurring', 'list'], {
          ...previousData,
          rules: previousData.rules.map(rule =>
            rule.id === id ? { ...rule, is_active } : rule
          )
        });
      }

      return { previousData };
    },
    onError: (_err, _newRule, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['recurring', 'list'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', 'list'] });
    },
  });

  const rules = response?.rules || [];
  const activeRules = rules.filter(r => r.is_active === 1);
  const inactiveRules = rules.filter(r => r.is_active !== 1);

  const totalMonthlyExpenses = activeRules
    .filter(r => r.type === 'expense' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMonthlyIncome = activeRules
    .filter(r => r.type === 'income' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <PageHeader
        title="Gastos fijos"
        subtitle="Lo que sale automáticamente cada mes."
        primaryAction={{
          label: "Nueva regla",
          icon: <Plus size={16} />,
          onClick: () => openModal(),
        }}
      >
        {/* Summary Pills */}
        {rules.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-card border border-border">
              <Zap size={13} className="text-emerald-400" />
              <span className="text-xs font-medium text-secondary">
                {activeRules.length} activos
              </span>
            </div>
            {totalMonthlyExpenses > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-red-500/5 border border-red-500/15">
                <TrendingDown size={13} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">
                  −${formatCurrency(totalMonthlyExpenses)}/mes
                </span>
              </div>
            )}
            {totalMonthlyIncome > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/15">
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <LoadingState minHeight="h-48" />
          ) : rules.length === 0 ? (
            <EmptyState
              icon={<Repeat className="w-9 h-9" />}
              secondaryIcon={<Sparkles size={14} className="text-white" />}
              title="Automatiza tus finanzas"
              description="Agrega tus suscripciones y pagos recurrentes para que se registren automáticamente cada mes."
              actionButton={<AnimatedButton text="Crear primera regla" onClick={() => openModal()} />}
              primaryColor="emerald"
            />
          ) : (
            <div className="space-y-6">
              {activeRules.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      Activos
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {activeRules.map(rule => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onToggle={() => toggleMutation.mutate({ id: rule.id, is_active: rule.is_active === 1 ? 0 : 1 })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {inactiveRules.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Pausados
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                    {inactiveRules.map(rule => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onToggle={() => toggleMutation.mutate({ id: rule.id, is_active: rule.is_active === 1 ? 0 : 1 })}
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
          className={`sm:hidden fixed right-4 z-40 group bg-accent hover:bg-emerald-600 active:scale-90 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-accent/30 transition-all duration-300 ${
            fabMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom) + 0.75rem)' }}
          aria-label="Nueva regla recurrente"
        >
          <Plus size={24} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
        </button>
      )}
    </div>
  );
}

function RuleCard({ rule, onToggle }: { rule: RecurringRule; onToggle: () => void }) {
  const isIncome = rule.type === 'income';
  const freqColor = frequencyColors[rule.frequency] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  const { openModal } = useRecurringModal();

  return (
    <div
      onClick={() => openModal(rule)}
      className="rounded-2xl p-4 flex flex-col gap-4 transition-all duration-150 cursor-pointer bg-card border border-border hover:bg-card-hover"
    >
      {/* Top Row */}
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            rule.category_icon ? 'bg-inset' : isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {rule.category_icon
            ? <span>{rule.category_icon}</span>
            : isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate text-primary">
            {rule.title}
          </p>
          {rule.category && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-inset text-secondary border border-border">
              {rule.category}
            </span>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={rule.is_active === 1 ? 'Pausar' : 'Activar'}
          className={`shrink-0 w-9 h-5 rounded-full transition-colors duration-300 ease-out flex items-center px-0.5 ${
            rule.is_active === 1 ? 'bg-emerald-500' : 'bg-zinc-600'
          }`}
        >
          <span className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-out ${
            rule.is_active === 1 ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Amount + Frequency */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight"
            style={{ color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}>
            {isIncome ? '+' : '−'}${formatCurrency(rule.amount)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${freqColor}`}>
              <Repeat size={9} />
              {frequencyLabel[rule.frequency]}
              {rule.frequency === 'monthly' && rule.day_of_month ? ` · día ${rule.day_of_month}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Next Run */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-inset border border-border">
        <Calendar size={12} className="text-muted shrink-0" />
        <span className="text-xs text-muted">Próxima ejecución</span>
        <span className="text-xs font-semibold ml-auto text-secondary">
          {format(parseISO(rule.next_run), "d 'de' MMM yyyy", { locale: es })}
        </span>
      </div>
    </div>
  );
}
