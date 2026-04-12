'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import type { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { X, ChevronDown, Users, Calendar } from 'lucide-react';
import { formatDateAbbreviated } from '@/lib/utils';
import { useDeleteTransaction } from '@/hooks/useDashboardData';
import { useCategories, useAccounts, useTags, useGroups } from '@/hooks/usePreferences';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { TransactionSuccessOverlay } from './TransactionSuccessOverlay';
import { CustomSelect } from './CustomSelect';
import { Trash2 } from 'lucide-react';
import { BaseModal } from './ui/BaseModal';
import type { Transaction } from '@/types/api';

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
  splits?: Array<{
    user_id: string;
    percentage: number;
  }>;
};

type ApiErrorResponse = {
  error?: string;
};

function getInitialSplitPercentages(transaction?: Transaction | null): Record<string, number> {
  if (!transaction?.splits?.length) {
    return {};
  }

  return transaction.splits.reduce<Record<string, number>>((accumulator, split) => {
    accumulator[split.user_id] = split.percentage;
    return accumulator;
  }, {});
}

function getEqualSplitPercentages(members: Array<{ user_id: string }>): Record<string, number> {
  if (members.length === 0) {
    return {};
  }

  const equalPct = Math.floor(100 / members.length);
  return members.reduce<Record<string, number>>((accumulator, member, index) => {
    accumulator[member.user_id] = index === 0 ? 100 - equalPct * (members.length - 1) : equalPct;
    return accumulator;
  }, {});
}

export function CreateTransactionModal({ isOpen, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  // Fetch dynamic categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
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
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type ?? 'expense');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(initialData ? new Intl.NumberFormat('es-CL').format(initialData.amount) : '');
  const [categoryId, setCategoryId] = useState<number | ''>(initialData?.category_id || '');
  const [accountId, setAccountId] = useState<number | ''>(initialData?.account_id || '');
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tag_ids || []);
  const [date, setDate] = useState(initialData ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSnapshot, setSuccessSnapshot] = useState<{ amount: string; type: 'expense' | 'income' } | null>(null);

  // Shared expense state
  const [isShared, setIsShared] = useState(Boolean(initialData?.is_shared));
  const [groupId, setGroupId] = useState<number | ''>(initialData?.group_id || '');
  const [splitPercentages, setSplitPercentages] = useState<Record<string, number>>(initialSplitPercentages);

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
    setError(null);
  };

  // Get currently selected group
  const selectedGroup = groups.find(g => g.id === groupId);

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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
        ? (err.response?.data?.error || err.message || 'Failed to save transaction. Try again.')
        : (err.message || 'Failed to save transaction. Try again.');
      setError(msg);
      setLoading(false);
    },
  });

  const deleteMutation = useDeleteTransaction();

  const handleDelete = () => {
    if (initialData?.id) {
      deleteMutation.mutate(initialData.id, {
        onSuccess: () => {
          resetAndClose();
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const parsedAmount = parseInt(amount.replace(/\./g, ''), 10);
    if (!parsedAmount || isNaN(parsedAmount)) {
      setLoading(false);
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

    if (isShared && groupId && selectedGroup) {
      payload.is_shared = 1;
      payload.group_id = groupId;
      payload.splits = selectedGroup.members.map(m => ({
        user_id: m.user_id,
        percentage: splitPercentages[m.user_id] || 0,
      }));
    } else {
      payload.is_shared = 0;
      payload.group_id = undefined;
    }

    mutation.mutate(payload, {
       onSettled: () => setLoading(false)
    });
  };

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess && successSnapshot) {
    return <TransactionSuccessOverlay amount={successSnapshot.amount} type={successSnapshot.type} />;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetAndClose}
      draggable
      lockScroll
      outerContent={
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Transaction"
          message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        />
      }
    >
        <div className="sticky top-0 z-30 flex items-center justify-between bg-card/90 px-4 pb-4 pt-5 backdrop-blur sm:p-6">
          <button type="button" onClick={resetAndClose} className="px-5 py-2.5 bg-inset text-primary rounded-full font-semibold text-sm sm:hidden hover:bg-border transition-colors">
            Cancelar
          </button>
          
          <h2 className="text-lg sm:text-xl font-bold text-primary absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
            {initialData ? 'Editar' : (type === 'expense' ? 'Agregar gasto' : 'Agregar ingreso')}
          </h2>
          
          <button 
            type="submit" 
            form="transaction-form" 
            disabled={loading || !title || !amount || categoryId === '' || accountId === ''} 
            className="px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-sm sm:hidden disabled:opacity-50 transition-colors"
          >
            Guardar
          </button>

          <button onClick={resetAndClose} className="hidden sm:block p-2 bg-inset rounded-full text-muted hover:text-white hover:bg-card-hover transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Type Toggle */}
          <div className="flex bg-inset rounded-xl p-1 mb-6">
            <button
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'expense' ? 'bg-card-hover text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'income' ? 'bg-card-hover text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
            >
              Income
            </button>
          </div>

          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Amount & Date - Ultra minimalist top */}
            <div className="flex flex-col items-center justify-center mb-6 mt-4">
              <div className="relative inline-flex items-baseline mb-3">
                <span
                  className="text-2xl font-bold mr-1"
                  style={{ color: type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)' }}
                >
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    if (!rawValue) {
                      setAmount('');
                      return;
                    }
                    setAmount(new Intl.NumberFormat('es-CL').format(parseInt(rawValue, 10)));
                  }}
                  className="bg-transparent text-center focus:outline-none font-extrabold text-5xl p-0 min-w-[100px] max-w-[250px] placeholder:text-muted"
                  style={{
                    width: `${Math.max(amount.length, 1) * 1.1}ch`,
                    color: type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)',
                  }}
                  placeholder="0"
                />
              </div>

              {/* Center Date Pill */}
              <div className="relative inline-block">
                <div className="bg-black dark:bg-white text-white dark:text-black rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity shadow-sm">
                  <Calendar size={14} />
                  <span>{formatDateAbbreviated(date)}</span>
                  <ChevronDown size={14} />
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>

            {/* Detail */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Detalle de la compra (opcional)</label>
              <input
                type="text"
                required={false}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-inset rounded-full px-5 py-3.5 text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-colors duration-200 font-medium text-sm"
                placeholder="Algún detalle para no olvidar?..."
              />
            </div>



            {/* Category Bento Grid */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-3">Categoría</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {isLoadingCategories ? (
                  Array(6).fill(0).map((_, i) => <div key={i} className="aspect-square bg-inset animate-pulse rounded-2xl" />)
                ) : (
                  categories
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
                          className={`flex flex-col items-center justify-center p-2 pt-4 pb-3 aspect-square rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-orange-500/10 border-orange-400/50 scale-[1.02] shadow-sm'
                              : 'bg-card border-border hover:bg-card-hover'
                          }`}
                        >
                          <span className="text-2xl mb-1">{cat.icon || '🏷️'}</span>
                          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-center px-1 leading-tight ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-primary'}`}>
                            {cat.name}
                          </span>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Accounts Bento Grid */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-3">Cuenta</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {isLoadingAccounts ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-inset animate-pulse rounded-2xl" />)
                ) : (
                  accounts.map((acc) => {
                    const isSelected = accountId === acc.id;
                    const getIcon = (t: string) => {
                       switch(t.toLowerCase()) {
                         case 'cash': return '💵';
                         case 'bank': return '🏦';
                         case 'credit': return '💳';
                         case 'investment': return '📈';
                         default: return '💰';
                       }
                    };
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={`flex flex-col items-center justify-center p-2 pt-3 pb-2 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-400/50 scale-[1.02] shadow-sm'
                            : 'bg-card border-border hover:bg-card-hover'
                        }`}
                      >
                        <span className="text-xl mb-1">{getIcon(acc.type)}</span>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-center px-1 leading-tight ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                          {acc.name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-secondary mb-2 ml-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {isLoadingTags ? (
                  <div className="h-8 w-full animate-pulse bg-inset rounded-lg"></div>
                ) : (
                  tags.map(tag => {
                    const isSelected = tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTagIds(tagIds.filter(id => id !== tag.id));
                          } else {
                            setTagIds([...tagIds, tag.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          isSelected 
                            ? 'bg-primary text-card border-primary shadow-sm scale-105' 
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

            {/* Shared Expense Section */}
            {groups.length > 0 && (
              <div className="border-t border-border pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase text-secondary">
                    <Users size={14} className={isShared ? 'text-violet-400' : ''} />
                    Gasto Compartido
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsShared(!isShared)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isShared ? 'bg-violet-500' : 'bg-border'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isShared ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {isShared && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-secondary mb-1">Group</label>
                      <CustomSelect
                        value={groupId}
                        onChange={(val) => {
                          const nextGroupId = typeof val === 'number' ? val : Number(val);
                          const nextGroup = groups.find((group) => group.id === nextGroupId);
                          setGroupId(nextGroupId);
                          setSplitPercentages(nextGroup ? getEqualSplitPercentages(nextGroup.members) : {});
                        }}
                        placeholder="Select group"
                        options={groups.map(g => ({ value: g.id, label: `👥 ${g.name}` }))}
                      />
                    </div>

                    {selectedGroup && (() => {
                      const members = selectedGroup.members;
                      const is2Members = members.length === 2;
                      const parsedAmt = amount ? parseInt(amount.replace(/\./g, ''), 10) : 0;
                      const firstPct = splitPercentages[members[0]?.user_id] || 0;

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
                            { label: 'Equal', values: members.map(() => Math.floor(100 / members.length)) },
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
                        const total = Object.values(pcts).reduce((a, b) => a + b, 0);
                        if (total !== 100 && members.length > 0) {
                          pcts[members[0].user_id] += (100 - total);
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
                          <label className="block text-xs font-semibold uppercase text-secondary">Split</label>

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
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                                    isActive
                                      ? 'bg-violet-500 text-white border-violet-500'
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
                                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${firstPct}%, #3f3f46 ${firstPct}%, #3f3f46 100%)`,
                                }}
                              />
                            </div>
                          )}

                          {/* Member breakdown */}
                          {members.map((member) => {
                            const pct = splitPercentages[member.user_id] || 0;
                            const splitAmt = Math.round((parsedAmt * pct) / 100);
                            return (
                              <div key={member.user_id} className="flex items-center gap-3 bg-inset/50 rounded-xl px-3 py-2">
                                <span className="text-violet-400 text-sm font-medium flex-1 truncate">{member.nickname}</span>
                                {!is2Members && (
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={pct}
                                    onChange={(e) => {
                                      setSplitPercentages(prev => ({
                                        ...prev,
                                        [member.user_id]: parseInt(e.target.value) || 0,
                                      }));
                                    }}
                                    className="w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                                    style={{
                                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${pct}%, #3f3f46 ${pct}%, #3f3f46 100%)`,
                                    }}
                                  />
                                )}
                                <span className="text-white text-sm font-bold w-10 text-center">{pct}%</span>
                                <span className="text-muted text-sm font-mono w-24 text-right">
                                  ${splitAmt.toLocaleString('es-CL')}
                                </span>
                              </div>
                            );
                          })}

                          {/* Validation */}
                          {(() => {
                            const total = Object.values(splitPercentages).reduce((a, b) => a + b, 0);
                            return total !== 100 ? (
                              <p className="text-red-400 text-xs">⚠ Must add up to 100% (currently {total}%)</p>
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
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !title || !amount || categoryId === '' || accountId === ''}
              className={`hidden sm:flex w-full py-4 rounded-xl font-bold items-center justify-center transition-colors mt-6 ${
                type === 'expense' 
                  ? 'bg-red-500 hover:bg-red-400 text-white disabled:bg-red-500/50' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white disabled:bg-emerald-500/50'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white/80 border-r-2 border-r-white/20"></div>
              ) : initialData ? 'Save Changes' : (
                 `Add ${type === 'expense' ? 'Expense' : 'Income'}`
              )}
            </button>

            {initialData && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={18} />
                Borrar movimiento
              </button>
            )}
          </form>
        </div>

    </BaseModal>
  );
}
