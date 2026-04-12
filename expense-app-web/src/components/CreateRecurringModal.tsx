'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, addMonths } from 'date-fns';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { formatDateAbbreviated } from '@/lib/utils';
import { useCategories, useAccounts, useTags } from '@/hooks/usePreferences';
import { CustomSelect } from './CustomSelect';
import { BaseModal } from './ui/BaseModal';
import type { RecurringRule } from '@/types/api';

type Props = {
  isOpen: boolean;
  initialData?: RecurringRule | null;
  onClose: () => void;
};

type RecurringPayload = {
  title: string;
  amount: number;
  category_id?: number;
  type: 'expense' | 'income';
  account_id?: number;
  tag_ids: number[];
  frequency: string;
  day_of_month: number | null;
  next_run: string;
  is_active: number;
};

export function CreateRecurringModal({ isOpen, initialData, onClose }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoriesData?.categories || [];

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts();
  const accounts = accountsData?.accounts || [];

  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const tags = tagsData?.tags || [];

  // Form State
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type ?? 'expense');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(initialData ? new Intl.NumberFormat('es-CL').format(initialData.amount) : '');
  const [categoryId, setCategoryId] = useState<number | ''>(initialData?.category_id || '');
  const [accountId, setAccountId] = useState<number | ''>(initialData?.account_id || '');
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tag_ids || []);
  const [frequency, setFrequency] = useState(initialData?.frequency ?? 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.day_of_month ? initialData.day_of_month.toString() : '1');
  const [nextRun, setNextRun] = useState(
    initialData?.next_run
      ? format(new Date(initialData.next_run), 'yyyy-MM-dd')
      : format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );

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
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      resetAndClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Error al guardar la regla. Intenta de nuevo.');
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    mutation.mutate({
      title,
      amount: parseInt(amount.replace(/\./g, ''), 10),
      category_id: categoryId !== '' ? categoryId : undefined,
      type,
      account_id: accountId !== '' ? accountId : undefined,
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
    setType('expense');
    setTitle('');
    setAmount('');
    setCategoryId('');
    setAccountId('');
    setTagIds([]);
    setFrequency('monthly');
    setDayOfMonth('1');
    setNextRun(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={resetAndClose}>
      <div className="flex justify-between items-center p-4 sm:p-6 sticky top-0 bg-card/90 backdrop-blur z-10">
          <button type="button" onClick={resetAndClose} className="px-5 py-2.5 bg-inset text-primary rounded-full font-semibold text-sm sm:hidden hover:bg-border transition-colors">
            Cancelar
          </button>
          
          <h2 className="text-lg sm:text-xl font-bold text-primary absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
            {initialData ? 'Editar' : 'Nueva regla'}
          </h2>
          
          <button 
            type="submit" 
            form="recurring-form" 
            disabled={loading || !title || !amount} 
            className="px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-sm sm:hidden disabled:opacity-50 transition-colors"
          >
            Guardar
          </button>

          <button onClick={resetAndClose} className="hidden sm:block p-2 bg-inset rounded-full text-muted hover:text-white hover:bg-card-hover transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex bg-inset rounded-xl p-1 mb-6">
             <button
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'expense' ? 'bg-card-hover text-primary shadow-sm' : 'text-secondary hover:text-zinc-300'}`}
             >
                Gasto
             </button>
             <button
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'income' ? 'bg-card-hover text-primary shadow-sm' : 'text-secondary hover:text-zinc-300'}`}
             >
                Ingreso
             </button>
          </div>

          <form id="recurring-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Amount - Ultra minimalist top */}
            <div className="flex justify-center mb-2 mt-4 relative">
              <div className="relative inline-flex items-baseline">
                <span className="text-2xl text-muted font-bold mr-1">$</span>
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
                  className="bg-transparent text-primary text-center focus:outline-none font-extrabold text-5xl p-0 min-w-[100px] max-w-[250px]"
                  style={{ width: `${Math.max(amount.length, 1) * 1.1}ch` }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Rule Name - Detail */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Nombre de la regla</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-inset rounded-full px-5 py-3.5 text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-colors duration-200 font-medium text-sm"
                placeholder="e.g. Netflix Suscripción..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
               {/* First Date Pill */}
               <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-secondary mb-2">Próximo cobro</label>
                  <div className="relative inline-block">
                    <div className="bg-black dark:bg-white text-white dark:text-black rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity">
                      <Calendar size={15} />
                      <span>{formatDateAbbreviated(nextRun)}</span>
                      <ChevronDown size={14} />
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

               {/* Frequency Sub-Select */}
               <div className="flex-1 z-30 min-w-0">
                  <label className="block text-sm font-semibold text-secondary mb-2">Frecuencia</label>
                  <div className="relative">
                    <CustomSelect
                      value={frequency}
                      onChange={(value) => setFrequency(String(value) as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                      options={[
                        { value: 'daily', label: 'Diaria' },
                        { value: 'weekly', label: 'Semanal' },
                        { value: 'monthly', label: 'Mensual' },
                        { value: 'yearly', label: 'Anual' }
                      ]}
                    />
                  </div>
               </div>
            </div>

            {frequency === 'monthly' && (
               <div>
                 <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-sm font-semibold text-secondary">Día del mes</label>
                    <span className="text-sm font-bold text-emerald-400">{dayOfMonth}</span>
                 </div>
                 <div className="flex items-center gap-4 bg-inset border border-border rounded-xl px-4 py-3">
                    <span className="text-xs text-secondary font-medium">1</span>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      required
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="text-xs text-secondary font-medium">30</span>
                 </div>
               </div>
            )}

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

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !title || !amount}
              className="hidden sm:flex w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 items-center justify-center"
            >
               {loading ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white/80 border-r-2 border-r-white/20"></div>
               ) : (
                 'Crear regla'
               )}
             </button>
          </form>
        </div>
    </BaseModal>
  );
}
