'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { addDays, addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCategories, useAccounts, useTags } from '@/hooks/usePreferences';
import {
  MAX_MONTH_DAY,
  nextMonthlyRun,
  nextWeekdayRun,
  weekdayOf,
} from '@/lib/recurring';
import { BaseModal } from './ui/BaseModal';
import { SubmitButton } from './ui/SubmitButton';
import { DeleteButton } from './ui/DeleteButton';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DateField, shortDayLabel } from './DateField';
import { TitleField } from './TitleField';
import {
  AccountPicker,
  AmountInput,
  CategoryPicker,
  FormModalHeader,
  TagPicker,
  TypeToggle,
  focusField,
  formatAmountInput,
  parseAmountInput,
  readLastAccount,
  rememberAccount,
  resolveAccount,
} from './TransactionFields';
import type { RecurringRule } from '@/types/api';

type Frequency = RecurringRule['frequency'];

type Props = {
  isOpen: boolean;
  initialData?: RecurringRule | null;
  onClose: () => void;
};

type RecurringPayload = {
  title: string;
  amount: number;
  category_id: number;
  type: 'expense' | 'income';
  account_id: number;
  tag_ids: number[];
  frequency: Frequency;
  day_of_month?: number;
  next_run: string;
  end_date: string | null;
  is_active: number;
};

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' },
  { value: 'daily', label: 'Diaria' },
];

const WEEKDAYS = [
  { value: 1, short: 'L', name: 'lunes' },
  { value: 2, short: 'M', name: 'martes' },
  { value: 3, short: 'M', name: 'miércoles' },
  { value: 4, short: 'J', name: 'jueves' },
  { value: 5, short: 'V', name: 'viernes' },
  { value: 6, short: 'S', name: 'sábado' },
  { value: 7, short: 'D', name: 'domingo' },
];

const MONTH_DAYS = Array.from({ length: MAX_MONTH_DAY }, (_, i) => i + 1);

const todayString = () => format(new Date(), 'yyyy-MM-dd');

/** New rules start on today's day of the month, from next month on. */
function defaultMonthlySchedule() {
  const day = Math.min(new Date().getDate(), MAX_MONTH_DAY);
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  return { day, nextRun: nextMonthlyRun(day, tomorrow) };
}
const longDate = (date: string) =>
  format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });

function scheduleSummary(
  frequency: Frequency,
  nextRun: string,
  dayOfMonth: number,
  endDate: string,
) {
  const start = longDate(nextRun);
  const base = {
    daily: `Todos los días, desde el ${start}`,
    weekly: `Cada ${WEEKDAYS[weekdayOf(nextRun) - 1]!.name}, desde el ${start}`,
    monthly: `El día ${dayOfMonth} de cada mes. El próximo es el ${start}`,
    yearly: `Cada año el ${format(parseISO(nextRun), "d 'de' MMMM", { locale: es })}, desde ${format(parseISO(nextRun), 'yyyy')}`,
  }[frequency];
  return endDate
    ? `${base}, hasta el ${format(parseISO(endDate), "d 'de' MMMM yyyy", { locale: es })}.`
    : `${base}.`;
}

const dayButtonClass = (selected: boolean) =>
  `focus-ring h-9 rounded-xl text-[13px] font-semibold tabular-nums transition-colors ${
    selected
      ? 'bg-accent text-on-accent'
      : 'bg-inset text-primary hover:bg-border'
  }`;

export function CreateRecurringModal({ isOpen, initialData, onClose }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();
  const categories = categoriesData?.categories || [];
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts();
  const accounts = accountsData?.accounts || [];
  const { data: tagsData } = useTags();
  const tags = tagsData?.tags || [];

  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const [defaults] = useState(defaultMonthlySchedule);
  const initialNextRun = initialData?.next_run ?? defaults.nextRun;

  const [type, setType] = useState<'expense' | 'income'>(
    initialData?.type ?? 'expense',
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(
    initialData
      ? new Intl.NumberFormat('es-CL').format(initialData.amount)
      : '',
  );
  const [categoryId, setCategoryId] = useState<number | ''>(
    initialData?.category_id || '',
  );
  const [accountId, setAccountId] = useState<number | ''>(
    initialData?.account_id || '',
  );
  const [lastAccountId, setLastAccountId] = useState(readLastAccount);
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tag_ids || []);
  const [frequency, setFrequency] = useState<Frequency>(
    initialData?.frequency ?? 'monthly',
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    initialData
      ? (initialData.day_of_month ??
          Math.min(Number(initialNextRun.slice(8, 10)), MAX_MONTH_DAY))
      : defaults.day,
  );
  const [nextRun, setNextRun] = useState(initialNextRun);
  const [endDate, setEndDate] = useState(initialData?.end_date ?? '');

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const effectiveAccountId = resolveAccount(
    accountId,
    accounts,
    lastAccountId,
    !initialData,
  );
  const today = todayString();
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM-dd');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring'] });
    queryClient.invalidateQueries({
      queryKey: ['transactions', 'availability'],
    });
  };

  const mutation = useMutation({
    mutationFn: async (ruleData: RecurringPayload) => {
      const res = initialData?.id
        ? await api.put(`/recurring/${initialData.id}`, ruleData)
        : await api.post('/recurring', ruleData);
      return res.data;
    },
    onSuccess: (_data, payload) => {
      setLastAccountId(payload.account_id);
      rememberAccount(payload.account_id);
      invalidate();
      resetAndClose();
    },
    onError: () => {
      setError(
        'No pudimos guardar la regla. Revisa tu conexión e intenta nuevamente.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initialData?.id) return;
      await api.delete(`/recurring/${initialData.id}`);
    },
    onSuccess: () => {
      invalidate();
      resetAndClose();
    },
    onError: () => {
      setError('No pudimos eliminar la regla. Intenta nuevamente.');
    },
  });

  const handleDelete = () => {
    setLoading(true);
    deleteMutation.mutate(undefined, {
      onSettled: () => setLoading(false),
    });
  };

  const changeType = (next: 'expense' | 'income') => {
    setType(next);
    if (selectedCategory && selectedCategory.type !== next) setCategoryId('');
  };

  const changeFrequency = (next: Frequency) => {
    setFrequency(next);
    if (next === 'monthly') setNextRun(nextMonthlyRun(dayOfMonth, today));
    else if (next === 'weekly')
      setNextRun(nextWeekdayRun(weekdayOf(nextRun), today));
    else if (nextRun < today) setNextRun(today);
  };

  const fail = (
    message: string,
    target: React.RefObject<HTMLElement | null>,
  ) => {
    setError(message);
    focusField(target);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseAmountInput(amount);
    if (!parsedAmount) return fail('Ingresa un monto.', amountRef);
    if (!selectedCategory || selectedCategory.type !== type)
      return fail('Elige una categoría.', categoryRef);
    if (effectiveAccountId === '') return fail('Elige una cuenta.', accountRef);
    if (endDate && endDate < nextRun) {
      setError('La fecha de término debe ser posterior al próximo cobro.');
      return;
    }

    setLoading(true);
    mutation.mutate(
      {
        title: title.trim() || selectedCategory.name,
        amount: parsedAmount,
        category_id: selectedCategory.id,
        type,
        account_id: effectiveAccountId,
        tag_ids: tagIds,
        frequency,
        day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
        next_run: nextRun,
        end_date: endDate || null,
        is_active: initialData ? initialData.is_active : 1,
      },
      { onSettled: () => setLoading(false) },
    );
  };

  const resetAndClose = () => {
    const fresh = defaultMonthlySchedule();
    setType('expense');
    setTitle('');
    setAmount('');
    setCategoryId('');
    setAccountId('');
    setTagIds([]);
    setFrequency('monthly');
    setDayOfMonth(fresh.day);
    setNextRun(fresh.nextRun);
    setEndDate('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const heading = initialData ? 'Editar regla' : 'Nueva regla';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetAndClose}
      label={heading}
      draggable
      lockScroll
      outerContent={
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar regla"
          message={`¿Estás seguro de que quieres eliminar "${title}"? Esta acción no se puede deshacer.`}
        />
      }
    >
      <FormModalHeader
        title={initialData ? 'Editar' : heading}
        formId="recurring-form"
        saving={loading}
        onClose={resetAndClose}
      />

      <form
        id="recurring-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 px-6 pb-6"
      >
        <TypeToggle value={type} onChange={changeType} />

        <div className="flex justify-center">
          <AmountInput
            inputRef={amountRef}
            type={type}
            autoFocus={!initialData}
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setError(null);
            }}
          />
        </div>

        <section aria-labelledby="schedule-label" className="space-y-4">
          <p
            id="schedule-label"
            className="text-secondary text-sm font-semibold"
          >
            Se repite
          </p>
          <div
            role="radiogroup"
            aria-label="Frecuencia"
            className="bg-inset -mt-2 flex rounded-xl p-1"
          >
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={frequency === f.value}
                onClick={() => changeFrequency(f.value)}
                className={`focus-ring flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors ${frequency === f.value ? 'bg-card text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {frequency === 'monthly' && (
            <div>
              <p
                id="month-day-label"
                className="text-secondary mb-2 text-xs font-medium"
              >
                Día del mes
              </p>
              <div
                role="radiogroup"
                aria-labelledby="month-day-label"
                className="grid grid-cols-7 gap-1"
              >
                {MONTH_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={dayOfMonth === day}
                    onClick={() => {
                      setDayOfMonth(day);
                      setNextRun(nextMonthlyRun(day, today));
                    }}
                    className={dayButtonClass(dayOfMonth === day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === 'weekly' && (
            <div>
              <p
                id="weekday-label"
                className="text-secondary mb-2 text-xs font-medium"
              >
                Día de la semana
              </p>
              <div
                role="radiogroup"
                aria-labelledby="weekday-label"
                className="grid grid-cols-7 gap-1"
              >
                {WEEKDAYS.map((day) => {
                  const selected = weekdayOf(nextRun) === day.value;
                  return (
                    <button
                      key={day.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={day.name}
                      onClick={() =>
                        setNextRun(nextWeekdayRun(day.value, today))
                      }
                      className={dayButtonClass(selected)}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(frequency === 'daily' || frequency === 'yearly') && (
            <div>
              <p className="text-secondary mb-2 text-xs font-medium">
                {frequency === 'daily' ? 'Desde' : 'Fecha del cobro'}
              </p>
              <DateField
                label={frequency === 'daily' ? 'Desde' : 'Fecha del cobro'}
                align="start"
                value={nextRun}
                onChange={setNextRun}
                presets={[
                  { value: today, label: 'Hoy' },
                  { value: tomorrow, label: 'Mañana' },
                  ...(frequency === 'yearly'
                    ? [{ value: nextMonth, label: shortDayLabel(nextMonth) }]
                    : []),
                ]}
              />
            </div>
          )}

          <div>
            <p className="text-secondary mb-2 text-xs font-medium">Termina</p>
            <DateField
              label="Fecha de término"
              align="start"
              value={endDate}
              onChange={setEndDate}
              emptyLabel="Nunca"
              presets={[]}
            />
          </div>

          <p
            aria-live="polite"
            className="bg-accent-soft text-primary rounded-xl px-4 py-3 text-sm"
          >
            {scheduleSummary(frequency, nextRun, dayOfMonth, endDate)}
          </p>
        </section>

        <CategoryPicker
          containerRef={categoryRef}
          categories={categories.filter((cat) => cat.type === type)}
          loading={isLoadingCategories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setError(null);
          }}
        />

        <TitleField
          id="recurring-title"
          label={
            <>
              Nombre <span className="text-muted font-normal">· opcional</span>
            </>
          }
          type={type}
          value={title}
          onChange={setTitle}
          onPick={(suggestion) => {
            setTitle(suggestion.title);
            const category = categories.find(
              (c) => c.id === suggestion.category_id,
            );
            if (category?.type === type) setCategoryId(category.id);
            if (accounts.some((a) => a.id === suggestion.account_id)) {
              setAccountId(suggestion.account_id!);
            }
            if (!parseAmountInput(amount)) {
              setAmount(formatAmountInput(String(suggestion.amount)));
            }
            setError(null);
          }}
          placeholder={selectedCategory?.name ?? 'Netflix, arriendo, sueldo…'}
          hint={
            !title.trim() &&
            selectedCategory && (
              <p className="text-muted mt-1.5 px-1 text-xs">
                Si lo dejas vacío, se guarda como “{selectedCategory.name}”.
              </p>
            )
          }
        />

        <AccountPicker
          containerRef={accountRef}
          accounts={accounts}
          loading={isLoadingAccounts}
          value={effectiveAccountId}
          onChange={(id) => {
            setAccountId(id);
            setError(null);
          }}
        />

        <TagPicker tags={tags} value={tagIds} onChange={setTagIds} />

        {error && (
          <p
            role="alert"
            className="text-expense rounded-xl bg-[var(--red-soft)] px-4 py-3 text-sm font-medium"
          >
            {error}
          </p>
        )}

        <SubmitButton
          loading={loading && !deleteMutation.isPending}
          text={initialData ? 'Guardar cambios' : 'Crear regla'}
        />

        {initialData && (
          <DeleteButton
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={loading}
            text="Eliminar regla"
            className="mt-4 sm:mt-2"
          />
        )}
      </form>
    </BaseModal>
  );
}
