'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { X, ChevronDown } from 'lucide-react';
import { Transaction, useDeleteTransaction } from '@/hooks/useDashboardData';
import { useCategories, useAccounts, useTags } from '@/hooks/usePreferences';
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

  // Form State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(new Intl.NumberFormat('es-CL').format(initialData.amount));
      setCategoryId(initialData.category_id || '');
      setAccountId(initialData.account_id || '');
      setTagIds(initialData.tag_ids || []);
      setDate(format(new Date(initialData.date), 'yyyy-MM-dd'));
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
  };

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
    setLoading(true);
    const parsedAmount = parseInt(amount.replace(/\./g, ''), 10);
    mutation.mutate({
      title,
      amount: parsedAmount,
      category_id: categoryId,
      type,
      account_id: accountId,
      tag_ids: tagIds,
      date,
    }, {
       onSettled: () => setLoading(false)
    });
  };

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-t-3xl lg:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-all"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
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
               <div className="flex-1">
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
               <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-lg transition-colors duration-200 scheme-dark"
                  />
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
               <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Category</label>
                  <div className="relative z-20">
                    <CustomSelect
                      value={categoryId}
                      onChange={setCategoryId}
                      placeholder={isLoadingCategories ? 'Loading...' : 'Select category'}
                      disabled={isLoadingCategories}
                      options={categories
                        .filter((cat) => cat.type === type)
                        .map((cat) => ({ value: cat.id, label: `${cat.icon || ' '} ${cat.name}` }))}
                    />
                  </div>
               </div>
               <div className="flex-1">
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

            <button
              type="submit"
              disabled={loading || !title || !amount}
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
