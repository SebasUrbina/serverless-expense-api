'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useRecurringModal } from '@/store/useRecurringModal';
import type { RecurringRule, RecurringRulesResponse } from '@/types/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardNotice } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

const frequencyLabel: Record<RecurringRule['frequency'], string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

/** Approximate occurrences per month, to compare rules of any frequency. */
const perMonth: Record<RecurringRule['frequency'], number> = {
  daily: 30,
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

const monthlyTotal = (rules: RecurringRule[], type: RecurringRule['type']) =>
  rules
    .filter((r) => r.type === type)
    .reduce((sum, r) => sum + r.amount * (perMonth[r.frequency] ?? 1), 0);

export default function RecurringPage() {
  const { openModal } = useRecurringModal();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery<RecurringRulesResponse>({
    queryKey: ['recurring', 'list'],
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
      await queryClient.cancelQueries({ queryKey: ['recurring', 'list'] });

      const previousData = queryClient.getQueryData<RecurringRulesResponse>([
        'recurring',
        'list',
      ]);

      if (previousData) {
        queryClient.setQueryData<RecurringRulesResponse>(
          ['recurring', 'list'],
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
        queryClient.setQueryData(['recurring', 'list'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', 'list'] });
      queryClient.invalidateQueries({
        queryKey: ['transactions', 'availability'],
      });
    },
  });

  const rules = response?.rules || [];
  const activeRules = rules.filter((r) => r.is_active === 1);
  const inactiveRules = rules.filter((r) => r.is_active !== 1);
  const monthlyExpenses = monthlyTotal(activeRules, 'expense');
  const monthlyIncome = monthlyTotal(activeRules, 'income');
  const toggle = (rule: RecurringRule) =>
    toggleMutation.mutate({
      id: rule.id,
      is_active: rule.is_active === 1 ? 0 : 1,
    });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Recurrentes"
        subtitle="Gastos e ingresos que se registran solos."
        narrow
        primaryAction={{
          label: 'Nueva regla',
          icon: <Plus size={16} />,
          onClick: () => openModal(),
          showOnMobile: rules.length > 0,
        }}
      >
        {activeRules.length > 0 && (
          <p className="text-secondary flex flex-wrap gap-x-3 gap-y-1 text-[13px] tabular-nums">
            {monthlyExpenses > 0 && (
              <span>
                Gastos{' '}
                <b className="text-primary font-semibold">
                  ≈ −${formatCurrency(monthlyExpenses)}
                </b>{' '}
                al mes
              </span>
            )}
            {monthlyIncome > 0 && (
              <span>
                Ingresos{' '}
                <b className="text-income font-semibold">
                  ≈ +${formatCurrency(monthlyIncome)}
                </b>{' '}
                al mes
              </span>
            )}
          </p>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
          {isLoading ? (
            <LoadingState minHeight="h-48" />
          ) : rules.length === 0 ? (
            <Card label="Sin reglas recurrentes">
              <CardNotice
                title="Aún no tienes pagos recurrentes"
                description="Agrega tus suscripciones, cuentas y sueldo para que se registren automáticamente en su fecha."
                action={{
                  label: 'Crear primera regla',
                  onClick: () => openModal(),
                }}
              />
            </Card>
          ) : (
            [
              { title: 'Activos', items: activeRules },
              { title: 'Pausados', items: inactiveRules },
            ]
              .filter((section) => section.items.length > 0)
              .map((section) => (
                <Card key={section.title} label={section.title}>
                  <CardHeader
                    title={section.title}
                    description={`${section.items.length} ${section.items.length === 1 ? 'regla' : 'reglas'}`}
                  />
                  <ul className="divide-border mt-3 divide-y">
                    {section.items.map((rule) => (
                      <RuleRow
                        key={rule.id}
                        rule={rule}
                        onEdit={() => openModal(rule)}
                        onToggle={() => toggle(rule)}
                      />
                    ))}
                  </ul>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

function nextRunLabel(nextRun: string) {
  const days = differenceInCalendarDays(parseISO(nextRun), new Date());
  if (days <= 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days < 7) return `en ${days} días`;
  return format(parseISO(nextRun), 'd MMM', { locale: es }).replace('.', '');
}

function RuleRow({
  rule,
  onEdit,
  onToggle,
}: {
  rule: RecurringRule;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const income = rule.type === 'income';
  const active = rule.is_active === 1;
  const color =
    useCategoryColors().get(rule.category_id) ?? 'var(--text-muted)';
  const schedule = [
    frequencyLabel[rule.frequency],
    rule.frequency === 'monthly' && rule.day_of_month
      ? `día ${rule.day_of_month}`
      : null,
    active ? `próximo ${nextRunLabel(rule.next_run)}` : 'en pausa',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="flex items-center gap-3 py-0.5">
      <button
        type="button"
        onClick={onEdit}
        className={`hover:bg-inset focus-ring -ml-2 grid min-h-14 min-w-0 flex-1 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2.5 text-left transition-colors ${active ? '' : 'opacity-60'}`}
      >
        <span
          aria-hidden="true"
          title={rule.category}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
          style={{
            background: `color-mix(in srgb, ${color} 18%, transparent)`,
            color,
          }}
        >
          {rule.category_icon ||
            (income ? (
              <ArrowUpRight size={18} />
            ) : (
              <ArrowDownRight size={18} />
            ))}
        </span>
        <span className="min-w-0">
          <span className="text-primary block truncate text-sm font-medium">
            {rule.title}
          </span>
          <span className="text-muted mt-1 block truncate text-xs">
            {schedule}
          </span>
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${income ? 'text-income' : 'text-primary'}`}
        >
          {income ? '+' : '−'}${formatCurrency(rule.amount)}
        </span>
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`${active ? 'Pausar' : 'Activar'} ${rule.title}`}
        onClick={onToggle}
        className={`focus-ring flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition-colors ${
          active ? 'bg-accent' : 'bg-border'
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </li>
  );
}
