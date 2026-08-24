'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { X, ChevronDown, Calendar } from 'lucide-react';
import {
  formatCurrencyInput,
  formatDateAbbreviated,
  parseCurrencyInput,
} from '@/lib/utils';
import {
  useCategories,
  useAccounts,
  useTags,
} from '@/features/preferences/hooks';
import { CustomSelect } from '@/components/CustomSelect';
import { BaseModal } from '@/components/ui/BaseModal';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import type { RecurringRule } from '@/types/api';
import { queryKeys } from '@/lib/query-keys';
import { TransactionTypeToggle } from '@/components/forms/TransactionTypeToggle';
import {
  AccountSelector,
  CategorySelector,
  TagSelector,
} from '@/components/forms/FinancialSelectors';
import {
  buildRecurringPayload,
  getInitialRecurringValues,
  type RecurringPayload,
} from '@/features/recurring/model/recurring';

type Props = {
  isOpen: boolean;
  initialData?: RecurringRule | null;
  onClose: () => void;
};

export function CreateRecurringModal({ isOpen, initialData, onClose }: Props) {
  const queryClient = useQueryClient();
  const initialValues = getInitialRecurringValues(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();
  const categories = categoriesData?.categories || [];

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts();
  const accounts = accountsData?.accounts || [];

  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const tags = tagsData?.tags || [];

  // Form State
  const [type, setType] = useState(initialValues.type);
  const [title, setTitle] = useState(initialValues.title);
  const [amount, setAmount] = useState(
    initialValues.amount ? formatCurrencyInput(initialValues.amount) : '',
  );
  const [categoryId, setCategoryId] = useState<number | ''>(
    initialValues.categoryId,
  );
  const [accountId, setAccountId] = useState<number | ''>(
    initialValues.accountId,
  );
  const [tagIds, setTagIds] = useState<number[]>(initialValues.tagIds);
  const [frequency, setFrequency] = useState(initialValues.frequency);
  const [dayOfMonth, setDayOfMonth] = useState(
    String(initialValues.dayOfMonth),
  );
  const [nextRun, setNextRun] = useState(initialValues.nextRun);
  const [endDate, setEndDate] = useState(initialValues.endDate);

  const mutation = useMutation({
    mutationFn: async (ruleData: RecurringPayload) => {
      if (initialData?.id) {
        const res = await api.put(`/recurring/${initialData.id}`, ruleData);
        return res.data;
      } else {
        const res = await api.post('/recurring', ruleData);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      resetAndClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Error al guardar la regla. Intenta de nuevo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initialData?.id) return;
      await api.delete(`/recurring/${initialData.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      resetAndClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Error al eliminar la regla.');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const loading = mutation.isPending || deleteMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = buildRecurringPayload(
      {
        title,
        amount: parseCurrencyInput(amount),
        categoryId,
        accountId,
        tagIds,
        type,
        frequency,
        dayOfMonth: Number(dayOfMonth),
        nextRun,
        endDate,
      },
      initialData?.is_active ?? 1,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    mutation.mutate(result.payload);
  };

  const resetAndClose = () => {
    const defaults = getInitialRecurringValues();
    setType(defaults.type);
    setTitle(defaults.title);
    setAmount('');
    setCategoryId(defaults.categoryId);
    setAccountId(defaults.accountId);
    setTagIds(defaults.tagIds);
    setFrequency(defaults.frequency);
    setDayOfMonth(String(defaults.dayOfMonth));
    setNextRun(defaults.nextRun);
    setEndDate(defaults.endDate);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetAndClose}
      ariaLabel={
        initialData ? 'Editar regla recurrente' : 'Crear regla recurrente'
      }
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
      <div className="bg-card/90 sticky top-0 z-10 flex items-center justify-between p-4 backdrop-blur sm:p-6">
        <button
          type="button"
          onClick={resetAndClose}
          className="bg-inset text-primary hover:bg-border rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:hidden"
        >
          Cancelar
        </button>

        <h2 className="text-primary absolute left-1/2 -translate-x-1/2 text-lg font-bold sm:static sm:translate-x-0 sm:text-xl">
          {initialData ? 'Editar' : 'Nueva regla'}
        </h2>

        <button
          type="submit"
          form="recurring-form"
          disabled={loading || !title || !amount}
          className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-bold text-emerald-600 transition-colors disabled:opacity-50 sm:hidden dark:text-emerald-400"
        >
          Guardar
        </button>

        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Cerrar regla recurrente"
          className="bg-inset text-muted hover:bg-card-hover hidden rounded-full p-2 transition-colors hover:text-white sm:block"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        <TransactionTypeToggle value={type} onChange={setType} />

        <form id="recurring-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Amount - Ultra minimalist top */}
          <div className="relative mt-4 mb-2 flex justify-center">
            <div className="relative inline-flex items-baseline">
              <span className="text-muted mr-1 text-2xl font-bold">$</span>
              <input
                id="recurring-amount"
                type="text"
                inputMode="numeric"
                aria-label="Monto"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(formatCurrencyInput(e.target.value));
                }}
                className="text-primary max-w-[250px] min-w-[100px] bg-transparent p-0 text-center text-5xl font-extrabold focus:outline-none"
                style={{ width: `${Math.max(amount.length, 1) * 1.1}ch` }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Rule Name - Detail */}
          <div>
            <label
              htmlFor="recurring-title"
              className="text-secondary mb-2 block text-sm font-semibold"
            >
              Nombre de la regla
            </label>
            <input
              id="recurring-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-inset text-primary placeholder:text-muted focus:ring-border w-full rounded-full px-5 py-3.5 text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none"
              placeholder="e.g. Netflix Suscripción..."
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {/* First Date Pill */}
            <div className="min-w-0 flex-1">
              <label
                htmlFor="recurring-next-run"
                className="text-secondary mb-2 block text-sm font-semibold"
              >
                Próximo cobro
              </label>
              <div className="relative inline-block">
                <div className="flex cursor-pointer items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black">
                  <Calendar size={15} />
                  <span>{formatDateAbbreviated(nextRun)}</span>
                  <ChevronDown size={14} />
                </div>
                <input
                  id="recurring-next-run"
                  type="date"
                  required
                  value={nextRun}
                  onChange={(e) => setNextRun(e.target.value)}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>

            {/* Frequency Sub-Select */}
            <div className="z-30 min-w-0 flex-1">
              <label
                htmlFor="recurring-frequency"
                className="text-secondary mb-2 block text-sm font-semibold"
              >
                Frecuencia
              </label>
              <div className="relative">
                <CustomSelect
                  id="recurring-frequency"
                  value={frequency}
                  onChange={(value) =>
                    setFrequency(
                      String(value) as
                        'daily' | 'weekly' | 'monthly' | 'yearly',
                    )
                  }
                  options={[
                    { value: 'daily', label: 'Diaria' },
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'monthly', label: 'Mensual' },
                    { value: 'yearly', label: 'Anual' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Optional End Date */}
          <div>
            <label
              htmlFor="recurring-end-date"
              className="text-secondary mb-2 block text-sm font-semibold"
            >
              Fecha de término (Opcional)
            </label>
            <div className="relative inline-block">
              <div className="bg-inset flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-80">
                <Calendar size={15} className="text-muted" />
                <span className={endDate ? 'text-primary' : 'text-muted'}>
                  {endDate
                    ? formatDateAbbreviated(endDate)
                    : 'Sin fecha de término'}
                </span>
                {endDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndDate('');
                    }}
                    className="text-muted ml-2 hover:text-red-500"
                    aria-label="Quitar fecha de término"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <input
                id="recurring-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>

          {frequency === 'monthly' && (
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <label
                  htmlFor="recurring-day-of-month"
                  className="text-secondary block text-sm font-semibold"
                >
                  Día del mes
                </label>
                <span className="text-sm font-bold text-emerald-400">
                  {dayOfMonth}
                </span>
              </div>
              <div className="bg-inset border-border flex items-center gap-4 rounded-xl border px-4 py-3">
                <span className="text-secondary text-xs font-medium">1</span>
                <input
                  id="recurring-day-of-month"
                  type="range"
                  min="1"
                  max="30"
                  required
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                />
                <span className="text-secondary text-xs font-medium">30</span>
              </div>
            </div>
          )}

          <CategorySelector
            idPrefix="recurring"
            categories={categories}
            type={type}
            selectedId={categoryId}
            onChange={setCategoryId}
            isLoading={isLoadingCategories}
          />
          <AccountSelector
            idPrefix="recurring"
            accounts={accounts}
            selectedId={accountId}
            onChange={setAccountId}
            isLoading={isLoadingAccounts}
          />
          <TagSelector
            idPrefix="recurring"
            tags={tags}
            selectedIds={tagIds}
            onChange={setTagIds}
            isLoading={isLoadingTags}
          />

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <SubmitButton
            loading={loading && !deleteMutation.isPending}
            disabled={loading || !title || !amount}
            variant="emerald"
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
      </div>
    </BaseModal>
  );
}
