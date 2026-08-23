'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import type { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { X, ChevronDown, Users, Calendar } from 'lucide-react';
import {
  formatCurrencyInput,
  formatDateAbbreviated,
  parseCurrencyInput,
} from '@/lib/utils';
import { useDeleteTransaction } from '@/hooks/useDashboardData';
import {
  useCategories,
  useAccounts,
  useTags,
  useGroups,
} from '@/features/preferences/hooks';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { TransactionSuccessOverlay } from './TransactionSuccessOverlay';
import { CustomSelect } from '@/components/CustomSelect';
import { BaseModal } from '@/components/ui/BaseModal';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import type { Transaction } from '@/types/api';
import { queryKeys } from '@/lib/query-keys';
import { TransactionTypeToggle } from '@/components/forms/TransactionTypeToggle';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
};

type TransactionPayload = {
  title: string;
  amount: number;
  category_id?: number;
  type: 'expense' | 'income';
  account_id?: number;
  tag_ids: number[];
  date: string;
  is_shared: 0 | 1;
  group_id?: number;
  installments?: number;
  splits?: Array<{
    user_id: string;
    percentage: number;
  }>;
};

type ApiErrorResponse = {
  error?: string;
};

function getInitialSplitPercentages(
  transaction?: Transaction | null,
): Record<string, number> {
  if (!transaction?.splits?.length) {
    return {};
  }

  return transaction.splits.reduce<Record<string, number>>(
    (accumulator, split) => {
      accumulator[split.user_id] = split.percentage;
      return accumulator;
    },
    {},
  );
}

function getEqualSplitPercentages(
  members: Array<{ user_id: string }>,
): Record<string, number> {
  if (members.length === 0) {
    return {};
  }

  const equalPct = Math.floor(100 / members.length);
  return members.reduce<Record<string, number>>(
    (accumulator, member, index) => {
      accumulator[member.user_id] =
        index === 0 ? 100 - equalPct * (members.length - 1) : equalPct;
      return accumulator;
    },
    {},
  );
}

export function CreateTransactionModal({
  isOpen,
  onClose,
  initialData,
}: Props) {
  const queryClient = useQueryClient();
  // Fetch dynamic categories
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();
  const categories = categoriesData?.categories || [];

  // Fetch dynamic accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts();
  const accounts = accountsData?.accounts || [];

  // Fetch dynamic tags
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const tags = tagsData?.tags || [];

  // Fetch shared groups
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];

  const initialSplitPercentages = getInitialSplitPercentages(initialData);

  // Form State
  const [type, setType] = useState<'expense' | 'income'>(
    initialData?.type ?? 'expense',
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(
    initialData
      ? formatCurrencyInput(initialData.amount)
      : '',
  );
  const [categoryId, setCategoryId] = useState<number | ''>(
    initialData?.category_id || '',
  );
  const [accountId, setAccountId] = useState<number | ''>(
    initialData?.account_id || '',
  );
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tag_ids || []);
  const [date, setDate] = useState(
    initialData
      ? format(new Date(initialData.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSnapshot, setSuccessSnapshot] = useState<{
    amount: string;
    type: 'expense' | 'income';
  } | null>(null);

  // Shared expense state
  const [isShared, setIsShared] = useState(Boolean(initialData?.is_shared));
  const [groupId, setGroupId] = useState<number | ''>(
    initialData?.group_id || '',
  );
  const [splitPercentages, setSplitPercentages] = useState<
    Record<string, number>
  >(initialSplitPercentages);

  // Installment (Cuotas) State
  const [isInstallments, setIsInstallments] = useState(false);
  const [installments, setInstallments] = useState(1);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setType('expense');
    setCategoryId('');
    setAccountId('');
    setTagIds([]);
    setIsShared(false);
    setGroupId('');
    setSplitPercentages({});
    setIsInstallments(false);
    setInstallments(1);
    setError(null);
  };

  // Get currently selected group
  const selectedGroup = groups.find((g) => g.id === groupId);

  const mutation = useMutation({
    mutationFn: async (newTx: TransactionPayload) => {
      if (initialData) {
        const res = await api.put(`/transactions/${initialData.id}`, newTx);
        return res.data;
      } else {
        const res = await api.post('/transactions', newTx);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      setSuccessSnapshot({ amount, type });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessSnapshot(null);
        resetAndClose();
      }, 1500);
    },
    onError: (err: AxiosError<ApiErrorResponse> | Error) => {
      const msg = isAxiosError<ApiErrorResponse>(err)
        ? err.response?.data?.error ||
          err.message ||
          'No se pudo guardar el movimiento. Intenta nuevamente.'
        : err.message || 'No se pudo guardar el movimiento. Intenta nuevamente.';
      setError(msg);
    },
  });

  const deleteMutation = useDeleteTransaction();
  const loading = mutation.isPending || deleteMutation.isPending;

  const handleDelete = () => {
    if (initialData?.id) {
      deleteMutation.mutate(initialData.id, {
        onSuccess: () => {
          resetAndClose();
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseCurrencyInput(amount);
    if (!parsedAmount || isNaN(parsedAmount)) {
      setError('Ingresa un monto válido mayor que cero.');
      return;
    }
    const payload: TransactionPayload = {
      title,
      amount: parsedAmount,
      category_id: categoryId !== '' ? categoryId : undefined,
      type,
      account_id: accountId !== '' ? accountId : undefined,
      tag_ids: tagIds,
      date,
      is_shared: 0,
    };

    if (type === 'expense' && isInstallments && installments > 1) {
      payload.installments = installments;
    }

    if (isShared && groupId && selectedGroup) {
      payload.is_shared = 1;
      payload.group_id = groupId;
      payload.splits = selectedGroup.members.map((m) => ({
        user_id: m.user_id,
        percentage: splitPercentages[m.user_id] || 0,
      }));
    } else {
      payload.is_shared = 0;
      payload.group_id = undefined;
    }

    mutation.mutate(payload);
  };

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess && successSnapshot) {
    return (
      <TransactionSuccessOverlay
        amount={successSnapshot.amount}
        type={successSnapshot.type}
      />
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetAndClose}
      ariaLabel={initialData ? 'Editar movimiento' : 'Crear movimiento'}
      draggable
      lockScroll
      outerContent={
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar movimiento"
          message={`¿Estás seguro de que quieres eliminar "${title}"? Esta acción no se puede deshacer.`}
        />
      }
    >
      <div className="bg-card/90 sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-4 backdrop-blur sm:p-6">
        <button
          type="button"
          onClick={resetAndClose}
          className="bg-inset text-primary hover:bg-border rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:hidden"
        >
          Cancelar
        </button>

        <h2 className="text-primary absolute left-1/2 -translate-x-1/2 text-lg font-bold sm:static sm:translate-x-0 sm:text-xl">
          {initialData
            ? 'Editar'
            : type === 'expense'
              ? 'Agregar gasto'
              : 'Agregar ingreso'}
        </h2>

        <button
          type="submit"
          form="transaction-form"
          disabled={
            loading ||
            !title ||
            !amount ||
            categoryId === '' ||
            accountId === '' ||
            (isShared &&
              groupId !== '' &&
              selectedGroup != null &&
              Object.values(splitPercentages).reduce((a, b) => a + b, 0) !==
                100)
          }
          className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-bold text-emerald-600 transition-colors disabled:opacity-50 sm:hidden dark:text-emerald-400"
        >
          Guardar
        </button>

        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Cerrar movimiento"
          className="bg-inset text-muted hover:bg-card-hover hidden rounded-full p-2 transition-colors hover:text-white sm:block"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {/* Type Toggle */}
        <TransactionTypeToggle value={type} onChange={setType} />

        <form
          id="transaction-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Amount & Date - Ultra minimalist top */}
          <div className="mt-4 mb-6 flex flex-col items-center justify-center">
            <div className="relative mb-3 inline-flex items-baseline">
              <span
                className="mr-1 text-2xl font-bold"
                style={{
                  color:
                    type === 'expense'
                      ? 'var(--color-expense)'
                      : 'var(--color-income)',
                }}
              >
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(formatCurrencyInput(e.target.value));
                }}
                className="placeholder:text-muted max-w-62.5 min-w-25 bg-transparent p-0 text-center text-2xl font-extrabold focus:outline-none"
                style={{
                  width: `${Math.max(amount.length, 1) * 1.1}ch`,
                  color:
                    type === 'expense'
                      ? 'var(--color-expense)'
                      : 'var(--color-income)',
                }}
                placeholder="0"
              />
            </div>

            {/* Center Date Pill */}
            <div className="relative inline-block">
              <div className="flex cursor-pointer items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-80 dark:bg-white dark:text-black">
                <Calendar size={14} />
                <span>{formatDateAbbreviated(date)}</span>
                <ChevronDown size={14} />
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>

          {/* Detail */}
          <div>
            <label className="text-secondary mb-2 block text-sm font-semibold">
              Detalle de la compra
            </label>
            <input
              type="text"
              required={false}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-inset text-primary placeholder:text-muted focus:ring-border w-full rounded-full px-5 py-3.5 text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none"
              placeholder="Algún detalle para no olvidar?..."
            />
          </div>

          {/* Category Bento Grid */}
          <div>
            <label className="text-secondary mb-3 block text-sm font-semibold">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {isLoadingCategories
                ? Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-inset aspect-square animate-pulse rounded-2xl"
                      />
                    ))
                : categories
                    .filter((cat) => cat.type === type)
                    .map((cat) => {
                      const isSelected = categoryId === cat.id;
                      // Determine palette based on index to give colorful look like reference image
                      // Using emerald as generic nice colorful look for now
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 pt-4 pb-3 transition-all ${
                            isSelected
                              ? 'scale-[1.02] border-orange-400/50 bg-orange-500/10 shadow-sm'
                              : 'bg-card border-border hover:bg-card-hover'
                          }`}
                        >
                          <span className="mb-1 text-2xl">
                            {cat.icon || '🏷️'}
                          </span>
                          <span
                            className={`px-1 text-center text-[9px] leading-tight font-bold tracking-wide uppercase sm:text-[10px] ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-primary'}`}
                          >
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
            </div>
          </div>

          {/* Accounts Bento Grid */}
          <div>
            <label className="text-secondary mb-3 block text-sm font-semibold">
              Cuenta
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {isLoadingAccounts
                ? Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-inset h-16 animate-pulse rounded-2xl"
                      />
                    ))
                : accounts.map((acc) => {
                    const isSelected = accountId === acc.id;
                    const getIcon = (t: string) => {
                      switch (t.toLowerCase()) {
                        case 'cash':
                          return '💵';
                        case 'bank':
                          return '🏦';
                        case 'credit':
                          return '💳';
                        case 'investment':
                          return '📈';
                        default:
                          return '💰';
                      }
                    };
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={`flex flex-col items-center justify-center rounded-2xl border p-2 pt-3 pb-2 transition-all ${
                          isSelected
                            ? 'scale-[1.02] border-blue-400/50 bg-blue-500/10 shadow-sm'
                            : 'bg-card border-border hover:bg-card-hover'
                        }`}
                      >
                        <span className="mb-1 text-xl">
                          {getIcon(acc.type)}
                        </span>
                        <span
                          className={`px-1 text-center text-[9px] leading-tight font-bold tracking-wide uppercase sm:text-[10px] ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}
                        >
                          {acc.name}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>

          <div>
            <label className="text-secondary mb-2 ml-1 block text-[10px] font-bold uppercase">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {isLoadingTags ? (
                <div className="bg-inset h-8 w-full animate-pulse rounded-lg"></div>
              ) : (
                tags.map((tag) => {
                  const isSelected = tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setTagIds(tagIds.filter((id) => id !== tag.id));
                        } else {
                          setTagIds([...tagIds, tag.id]);
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-card border-primary scale-105 shadow-sm'
                          : 'bg-inset text-muted border-border hover:border-border-subtle'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Installments (Cuotas) Section */}
          {type === 'expense' && !initialData && (
            <div className="border-border mt-2 border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-secondary flex items-center gap-2 text-xs font-bold uppercase">
                  <Calendar
                    size={14}
                    className={isInstallments ? 'text-orange-400' : ''}
                  />
                  Pagar en cuotas
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isInstallments;
                    setIsInstallments(nextVal);
                    if (nextVal) {
                      setInstallments(3); // default to 3 cuotas
                    } else {
                      setInstallments(1);
                    }
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isInstallments ? 'bg-orange-500' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isInstallments ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isInstallments && (
                <div className="animate-in fade-in space-y-3 duration-200">
                  <div>
                    <label className="text-secondary mb-2 block text-xs font-semibold uppercase">
                      Cantidad de cuotas
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={2}
                        max={36}
                        required
                        value={installments}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setInstallments(
                            isNaN(val) ? 2 : Math.max(2, Math.min(36, val)),
                          );
                        }}
                        className="bg-inset text-primary focus:ring-border w-20 rounded-full px-4 py-2.5 text-center text-sm font-bold transition-colors duration-200 focus:ring-1 focus:outline-none"
                      />
                      <div className="flex gap-1">
                        {[3, 6, 12, 18, 24].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setInstallments(num)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                              installments === num
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'bg-inset text-muted border-border hover:border-orange-500/50 hover:text-orange-300'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const parsedAmt = amount
                      ? parseCurrencyInput(amount)
                      : 0;
                    if (parsedAmt > 0 && installments >= 2) {
                      const baseAmt = Math.floor(parsedAmt / installments);
                      const remainder = parsedAmt - baseAmt * installments;
                      const firstAmt = baseAmt + remainder;
                      const otherAmt = baseAmt;
                      return (
                        <p className="text-secondary text-xs italic">
                          Se crearán {installments} transacciones mensuales de{' '}
                          <span className="text-primary font-bold">
                            ${firstAmt.toLocaleString('es-CL')}
                          </span>{' '}
                          (primera cuota) y{' '}
                          <span className="text-primary font-bold">
                            ${otherAmt.toLocaleString('es-CL')}
                          </span>{' '}
                          (restantes).
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Shared Expense Section */}
          {groups.length > 0 && (
            <div className="border-border mt-2 border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-secondary flex items-center gap-2 text-xs font-bold uppercase">
                  <Users
                    size={14}
                    className={isShared ? 'text-violet-400' : ''}
                  />
                  Gasto Compartido
                </label>
                <button
                  type="button"
                  onClick={() => setIsShared(!isShared)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isShared ? 'bg-violet-500' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isShared ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isShared && (
                <div className="animate-in fade-in space-y-3 duration-200">
                  <div>
                    <label className="text-secondary mb-1 block text-xs font-semibold uppercase">
                      Grupo
                    </label>
                    <CustomSelect
                      value={groupId}
                      onChange={(val) => {
                        const nextGroupId =
                          typeof val === 'number' ? val : Number(val);
                        const nextGroup = groups.find(
                          (group) => group.id === nextGroupId,
                        );
                        setGroupId(nextGroupId);
                        setSplitPercentages(
                          nextGroup
                            ? getEqualSplitPercentages(nextGroup.members)
                            : {},
                        );
                      }}
                      placeholder="Seleccionar grupo"
                      options={groups.map((g) => ({
                        value: g.id,
                        label: `👥 ${g.name}`,
                      }))}
                    />
                  </div>

                  {selectedGroup &&
                    (() => {
                      const members = selectedGroup.members;
                      const is2Members = members.length === 2;
                      const parsedAmt = amount
                        ? parseCurrencyInput(amount)
                        : 0;
                      const firstPct =
                        splitPercentages[members[0]?.user_id] || 0;

                      // Preset buttons config
                      const presets = is2Members
                        ? [
                            { label: '50 / 50', values: [50, 50] },
                            { label: '60 / 40', values: [60, 40] },
                            { label: '70 / 30', values: [70, 30] },
                            { label: '80 / 20', values: [80, 20] },
                            { label: '100 / 0', values: [100, 0] },
                          ]
                        : [
                            {
                              label: 'Igual',
                              values: members.map(() =>
                                Math.floor(100 / members.length),
                              ),
                            },
                          ];

                      const applyPreset = (values: number[]) => {
                        const pcts: Record<string, number> = {};
                        members.forEach((m, i) => {
                          if (i < values.length) {
                            pcts[m.user_id] = values[i];
                          } else {
                            // Distribute remainder for equal split
                            pcts[m.user_id] = values[0];
                          }
                        });
                        // Fix rounding: ensure total = 100
                        const total = Object.values(pcts).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        if (total !== 100 && members.length > 0) {
                          pcts[members[0].user_id] += 100 - total;
                        }
                        setSplitPercentages(pcts);
                      };

                      const handleSliderChange = (value: number) => {
                        if (is2Members) {
                          setSplitPercentages({
                            [members[0].user_id]: value,
                            [members[1].user_id]: 100 - value,
                          });
                        }
                      };

                      return (
                        <div className="space-y-3">
                          <label className="text-secondary block text-xs font-semibold uppercase">
                            División
                          </label>

                          {/* Preset Buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            {presets.map((preset) => {
                              const isActive = is2Members
                                ? firstPct === preset.values[0]
                                : false;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => applyPreset(preset.values)}
                                  className={`rounded-lg border px-3 py-1 text-xs font-bold transition-all ${
                                    isActive
                                      ? 'border-violet-500 bg-violet-500 text-white'
                                      : 'bg-inset text-muted border-border hover:border-violet-500/50 hover:text-violet-300'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Slider for 2-member groups */}
                          {is2Members && (
                            <div className="space-y-2">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={firstPct}
                                onChange={(e) =>
                                  handleSliderChange(parseInt(e.target.value))
                                }
                                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                                style={{
                                  background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${firstPct}%, #3f3f46 ${firstPct}%, #3f3f46 100%)`,
                                }}
                              />
                            </div>
                          )}

                          {/* Member breakdown */}
                          {members.map((member) => {
                            const pct = splitPercentages[member.user_id] || 0;
                            const splitAmt = Math.round(
                              (parsedAmt * pct) / 100,
                            );
                            return (
                              <div
                                key={member.user_id}
                                className="bg-inset/50 flex items-center gap-3 rounded-xl px-3 py-2"
                              >
                                <span className="flex-1 truncate text-sm font-medium text-violet-400">
                                  {member.nickname}
                                </span>
                                {!is2Members && (
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={pct}
                                    onChange={(e) => {
                                      setSplitPercentages((prev) => ({
                                        ...prev,
                                        [member.user_id]:
                                          parseInt(e.target.value) || 0,
                                      }));
                                    }}
                                    className="h-1.5 w-20 cursor-pointer appearance-none rounded-full"
                                    style={{
                                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${pct}%, #3f3f46 ${pct}%, #3f3f46 100%)`,
                                    }}
                                  />
                                )}
                                <span className="w-10 text-center text-sm font-bold text-white">
                                  {pct}%
                                </span>
                                <span className="text-muted w-24 text-right font-mono text-sm">
                                  ${splitAmt.toLocaleString('es-CL')}
                                </span>
                              </div>
                            );
                          })}

                          {/* Validation */}
                          {(() => {
                            const total = Object.values(
                              splitPercentages,
                            ).reduce((a, b) => a + b, 0);
                            return total !== 100 ? (
                              <p className="text-xs text-red-400">
                                Debe sumar 100% (actualmente {total}%)
                              </p>
                            ) : null;
                          })()}
                        </div>
                      );
                    })()}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              ⚠️ {error}
            </div>
          )}

          <SubmitButton
            loading={loading}
            disabled={
              loading ||
              !title ||
              !amount ||
              categoryId === '' ||
              accountId === '' ||
              !!(
                isShared &&
                groupId &&
                selectedGroup &&
                Object.values(splitPercentages).reduce((a, b) => a + b, 0) !==
                  100
              )
            }
            variant={type}
            text={
              initialData
                ? 'Guardar cambios'
                : `Agregar ${type === 'expense' ? 'gasto' : 'ingreso'}`
            }
          />

          {initialData && (
            <DeleteButton
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={loading}
              text="Borrar movimiento"
            />
          )}
        </form>
      </div>
    </BaseModal>
  );
}
