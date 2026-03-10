'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, addMonths } from 'date-fns';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { formatDateAbbreviated } from '@/lib/utils';
import { useCategories, useAccounts, useTags } from '@/hooks/usePreferences';
import { CustomSelect } from './CustomSelect';
import { RecurringRule } from '@/app/recurring/page';

type Props = {
  isOpen: boolean;
  initialData?: RecurringRule | null;
  onClose: () => void;
};

export function CreateRecurringModal({ isOpen, initialData, onClose }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoriesData?.categories || [];

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts();
  const accounts = accountsData?.accounts || [];

  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const tags = tagsData?.tags || [];

  // Form State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [nextRun, setNextRun] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(new Intl.NumberFormat('es-CL').format(initialData.amount));
      
      const category = categories.find(c => c.name === initialData.category);
      setCategoryId(category ? category.id : '');
      
      const account = accounts.find(a => a.name === initialData.account);
      setAccountId(account ? account.id : '');
      
      setFrequency(initialData.frequency);
      setDayOfMonth(initialData.day_of_month ? initialData.day_of_month.toString() : '1');
      
      try {
        setNextRun(format(new Date(initialData.next_run), 'yyyy-MM-dd'));
      } catch (e) {
        setNextRun(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
      }

      // We'd need to fetch tags if they were returned in initialData, but skipping for now
      // as RecurringRule doesn't expose tagIds directly yet.
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setCategoryId('');
      setAccountId('');
      setFrequency('monthly');
      setDayOfMonth('1');
      setNextRun(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
      setTagIds([]);
    }
  }, [initialData, categories.length, accounts.length, isOpen]);

  const mutation = useMutation({
    mutationFn: async (ruleData: any) => {
      if (initialData?.id) {
        const res = await api.put(`/recurring/${initialData.id}`, ruleData);
        return res.data;
      } else {
        const res = await api.post('/recurring', ruleData);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      resetAndClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    mutation.mutate({
      title,
      amount: parseInt(amount.replace(/\./g, ''), 10),
      category_id: categoryId,
      type,
      account_id: accountId,
      tag_ids: tagIds,
      frequency,
      day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth, 10) : null,
      next_run: nextRun,
      is_active: initialData ? initialData.is_active : 1
    }, {
       onSettled: () => setLoading(false)
    });
  };

  const resetAndClose = () => {
    setTitle('');
    setAmount('');
    setNextRun(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    setTagIds([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl transition-all"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
          <h2 className="text-xl font-bold text-white">New Recurring Rule</h2>
          <button onClick={resetAndClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
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
             <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors duration-200"
                  placeholder="e.g. Netflix Subscription"
                />
             </div>

             <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                   <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">Amount</label>
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
                <div className="flex-1 z-30 min-w-0">
                   <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">Frequency</label>
                   <div className="relative">
                     <CustomSelect
                       value={frequency}
                       onChange={setFrequency}
                       options={[
                         { value: 'daily', label: 'Daily' },
                         { value: 'weekly', label: 'Weekly' },
                         { value: 'monthly', label: 'Monthly' },
                         { value: 'yearly', label: 'Yearly' }
                       ]}
                     />
                   </div>
                </div>
             </div>

             {frequency === 'monthly' && (
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                     <label className="block text-[10px] font-bold uppercase text-zinc-500">Day of Month</label>
                     <span className="text-sm font-bold text-emerald-400">{dayOfMonth}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                     <span className="text-xs text-zinc-500 font-medium">1</span>
                     <input
                       type="range"
                       min="1"
                       max="30"
                       required
                       value={dayOfMonth}
                       onChange={(e) => setDayOfMonth(e.target.value)}
                       className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                     />
                     <span className="text-xs text-zinc-500 font-medium">30</span>
                  </div>
                </div>
             )}

             <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 z-20 min-w-0">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">Category</label>
                   <div className="relative">
                     <CustomSelect
                       value={categoryId}
                       onChange={setCategoryId}
                       placeholder={isLoadingCategories ? 'Loading...' : 'Select category'}
                       disabled={isLoadingCategories}
                       options={categories
                         .filter(cat => cat.type === type)
                         .map(cat => ({ value: cat.id, label: `${cat.icon || '🏷️'} ${cat.name}` }))}
                     />
                   </div>
               </div>
               <div className="flex-1 z-10 min-w-0">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">Account</label>
                  <div className="relative">
                    <CustomSelect
                      value={accountId}
                      onChange={setAccountId}
                      placeholder={isLoadingAccounts ? 'Loading...' : 'Select account'}
                      disabled={isLoadingAccounts}
                      options={accounts.map(acc => ({
                          value: acc.id,
                          label: `${acc.name} (${acc.type})`
                      }))}
                    />
                  </div>
               </div>
               <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1 ml-1">First Run / Next Run</label>
                  <div className="relative">
                    <div className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between text-white transition-colors duration-200">
                      <span className="text-sm font-medium">
                        {formatDateAbbreviated(nextRun)}
                      </span>
                      <Calendar size={16} className="text-zinc-500" />
                    </div>
                    <input
                      type="date"
                      required
                      value={nextRun}
                      onChange={(e) => setNextRun(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center"
            >
               {loading ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white/80 border-r-2 border-r-white/20"></div>
               ) : (
                 'Create Automated Rule'
               )}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
}
