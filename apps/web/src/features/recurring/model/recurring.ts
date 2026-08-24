import { addMonths, format, parseISO } from 'date-fns';
import type { RecurringRule } from '@/types/api';

export type RecurringFormValues = {
  title: string;
  amount: number;
  categoryId: number | '';
  accountId: number | '';
  tagIds: number[];
  type: RecurringRule['type'];
  frequency: RecurringRule['frequency'];
  dayOfMonth: number;
  nextRun: string;
  endDate: string;
};

export type RecurringPayload = {
  title: string;
  amount: number;
  category_id: number;
  account_id: number;
  tag_ids: number[];
  type: RecurringRule['type'];
  frequency: RecurringRule['frequency'];
  day_of_month?: number;
  next_run: string;
  end_date?: string;
  is_active: number;
};

export function getInitialRecurringValues(
  rule?: RecurringRule | null,
): RecurringFormValues {
  return {
    title: rule?.title ?? '',
    amount: rule?.amount ?? 0,
    categoryId: rule?.category_id ?? '',
    accountId: rule?.account_id ?? '',
    tagIds: rule?.tag_ids ?? [],
    type: rule?.type ?? 'expense',
    frequency: rule?.frequency ?? 'monthly',
    dayOfMonth: rule?.day_of_month ?? 1,
    nextRun: rule?.next_run
      ? format(parseISO(rule.next_run), 'yyyy-MM-dd')
      : format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: rule?.end_date
      ? format(parseISO(rule.end_date), 'yyyy-MM-dd')
      : '',
  };
}

export function buildRecurringPayload(
  values: RecurringFormValues,
  isActive = 1,
): { ok: true; payload: RecurringPayload } | { ok: false; error: string } {
  const title = values.title.trim();
  if (!title) return { ok: false, error: 'Ingresa un nombre para la regla.' };
  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    return { ok: false, error: 'Ingresa un monto válido mayor que cero.' };
  }
  if (values.categoryId === '') {
    return { ok: false, error: 'Selecciona una categoría.' };
  }
  if (values.accountId === '') {
    return { ok: false, error: 'Selecciona una cuenta.' };
  }
  if (!values.nextRun) {
    return { ok: false, error: 'Selecciona el próximo cobro.' };
  }
  if (values.endDate && values.endDate < values.nextRun) {
    return {
      ok: false,
      error: 'La fecha de término no puede ser anterior al próximo cobro.',
    };
  }
  if (
    values.frequency === 'monthly' &&
    (!Number.isInteger(values.dayOfMonth) ||
      values.dayOfMonth < 1 ||
      values.dayOfMonth > 30)
  ) {
    return { ok: false, error: 'Selecciona un día del mes entre 1 y 30.' };
  }

  return {
    ok: true,
    payload: {
      title,
      amount: values.amount,
      category_id: values.categoryId,
      account_id: values.accountId,
      tag_ids: values.tagIds,
      type: values.type,
      frequency: values.frequency,
      day_of_month:
        values.frequency === 'monthly' ? values.dayOfMonth : undefined,
      next_run: values.nextRun,
      end_date: values.endDate || undefined,
      is_active: isActive,
    },
  };
}

export function summarizeRecurringRules(rules: RecurringRule[]) {
  return rules.reduce(
    (summary, rule) => {
      const target = rule.is_active === 1 ? summary.active : summary.inactive;
      target.push(rule);

      if (rule.is_active === 1 && rule.frequency === 'monthly') {
        if (rule.type === 'income') summary.monthlyIncome += rule.amount;
        else summary.monthlyExpenses += rule.amount;
      }

      return summary;
    },
    {
      active: [] as RecurringRule[],
      inactive: [] as RecurringRule[],
      monthlyIncome: 0,
      monthlyExpenses: 0,
    },
  );
}
