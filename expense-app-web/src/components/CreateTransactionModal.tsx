'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { X, ChevronDown, Users, Calendar } from 'lucide-react';
import { formatDateAbbreviated } from '@/lib/utils';
import { Transaction, useDeleteTransaction } from '@/hooks/useDashboardData';
import { useCategories, useAccounts, useTags, useGroups } from '@/hooks/usePreferences';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CustomSelect } from './CustomSelect';
import { Trash2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
};

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

  // Form State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared expense state
  const [isShared, setIsShared] = useState(false);
  const [groupId, setGroupId] = useState<number | ''>('');
  const [splitPercentages, setSplitPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(new Intl.NumberFormat('es-CL').format(initialData.amount));
      setCategoryId(initialData.category_id || '');
      setAccountId(initialData.account_id || '');
      setTagIds(initialData.tag_ids || []);
      setDate(format(new Date(initialData.date), 'yyyy-MM-dd'));
      setIsShared(!!initialData.is_shared);
      setGroupId(initialData.group_id || '');
      // Restore split percentages
      if (initialData.splits && initialData.splits.length > 0) {
        const pcts: Record<string, number> = {};
        initialData.splits.forEach(s => { pcts[s.user_id] = s.percentage; });
        setSplitPercentages(pcts);
      }
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

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

  // Auto-set equal splits when group changes
  useEffect(() => {
    if (selectedGroup) {
      const memberCount = selectedGroup.members.length;
      const equalPct = Math.floor(100 / memberCount);
      const pcts: Record<string, number> = {};
      selectedGroup.members.forEach((m, idx) => {
        pcts[m.user_id] = idx === 0 ? 100 - equalPct * (memberCount - 1) : equalPct;
      });
      setSplitPercentages(pcts);
    }
  }, [groupId]);

  const mutation = useMutation({
    mutationFn: async (newTx: any) => {
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
      resetAndClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save transaction. Try again.';
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
    const payload: any = {
      title,
      amount: parsedAmount,
      category_id: categoryId !== '' ? categoryId : undefined,
      type,
      account_id: accountId !== '' ? accountId : undefined,
      tag_ids: tagIds,
      date,
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

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl transition-all"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-30">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={resetAndClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Type Toggle */}
          <div className="flex bg-zinc-900 rounded-xl p-1 mb-6">
            <button
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'expense' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'income' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
               <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Amount</label>
                  <div className="relative group">
                     <span className="absolute left-4 top-3.5 text-zinc-400 font-bold group-focus-within:text-emerald-400 transition-colors">$</span>
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
                       className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 font-bold text-lg transition-colors duration-200"
                       placeholder="0"
                     />
                  </div>
               </div>
               <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Date</label>
                  <div className="relative">
                    <div className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between text-white transition-colors duration-200">
                      <span className="text-lg font-medium">
                        {formatDateAbbreviated(date)}
                      </span>
                      <Calendar size={18} className="text-zinc-500" />
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
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Description / Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors duration-200 font-medium"
                placeholder="e.g. Netflix Subscription"
              />
            </div>

            <div className="flex gap-4">
               <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Category</label>
                  <div className="relative z-20">
                    <CustomSelect
                      value={categoryId}
                      onChange={setCategoryId}
                      placeholder={isLoadingCategories ? 'Loading...' : 'Select category'}
                      disabled={isLoadingCategories}
                      options={categories
                        .filter((cat) => cat.type === type)
                        .map((cat) => ({ value: cat.id, label: `${cat.icon || '🏷️'} ${cat.name}` }))}
                    />
                  </div>
               </div>
               <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Account</label>
                  <div className="relative z-10">
                    <CustomSelect
                      value={accountId}
                      onChange={setAccountId}
                      placeholder={isLoadingAccounts ? 'Loading...' : 'Select account'}
                      disabled={isLoadingAccounts}
                      options={accounts.map((acc) => ({
                        value: acc.id,
                        label: `${acc.name} (${acc.type})`,
                      }))}
                    />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2 ml-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {isLoadingTags ? (
                  <div className="h-8 w-full animate-pulse bg-zinc-900 rounded-lg"></div>
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
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm scale-105' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
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
              <div className="border-t border-zinc-800 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                    <Users size={14} className={isShared ? 'text-violet-400' : ''} />
                    Shared Expense
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsShared(!isShared)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isShared ? 'bg-violet-500' : 'bg-zinc-700'
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
                      <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Group</label>
                      <CustomSelect
                        value={groupId}
                        onChange={(val) => setGroupId(val as number)}
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
                          <label className="block text-xs font-semibold uppercase text-zinc-500">Split</label>

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
                                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-violet-500/50 hover:text-violet-300'
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
                          {members.map((member, idx) => {
                            const pct = splitPercentages[member.user_id] || 0;
                            const splitAmt = Math.round((parsedAmt * pct) / 100);
                            return (
                              <div key={member.user_id} className="flex items-center gap-3 bg-zinc-900/50 rounded-xl px-3 py-2">
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
                                <span className="text-zinc-400 text-sm font-mono w-24 text-right">
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
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-colors mt-6 ${
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
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={18} />
                Delete Transaction
              </button>
            )}
          </form>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
      />
    </div>
  );
}
