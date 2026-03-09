'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Repeat, Plus, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { CreateRecurringModal } from '@/components/CreateRecurringModal';
import { useState } from 'react';

type RecurringRule = {
  id: number;
  title: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  account: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  next_run: string;
  is_active: number;
};

export default function RecurringPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: response, isLoading } = useQuery<{ rules: RecurringRule[] }>({
    queryKey: ['recurring', 'list'],
    queryFn: async () => {
      const res = await api.get('/recurring');
      return res.data;
    }
  });

  const rules = response?.rules || [];

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Recurring Tracker</h1>
          <p className="text-zinc-400">Manage subscriptions, salaries, and automated payments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} /> New Rule
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
        </div>
      ) : rules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rule.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {rule.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{rule.title}</h3>
                    <p className="text-zinc-500 text-sm">{rule.category}</p>
                  </div>
                </div>
                {rule.is_active === 1 ? (
                  <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                  <XCircle className="text-zinc-600" size={20} />
                )}
              </div>
              
              <div className="mb-6">
                <p className={`text-3xl font-bold tracking-tight mb-1 ${rule.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                  {rule.type === 'income' ? '+' : '-'}${rule.amount.toLocaleString('es-CL')}
                </p>
                <div className="flex items-center text-zinc-400 text-sm gap-1">
                  <Repeat size={14} className="mr-1" />
                  <span className="capitalize">{rule.frequency}</span>
                  {rule.day_of_month && ` on day ${rule.day_of_month}`}
                </div>
              </div>

              <div className="bg-black rounded-xl p-4 flex items-center justify-between border border-zinc-800/50">
                 <div className="flex items-center text-sm">
                   <Calendar size={16} className="text-zinc-500 mr-2" />
                   <span className="text-zinc-400">Next run</span>
                 </div>
                 <span className="text-white font-semibold">{format(parseISO(rule.next_run), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl flex-1 flex flex-col items-center justify-center text-zinc-500 p-12 text-center">
            <Repeat className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">No active rules</h3>
            <p className="max-w-sm border-zinc-800">You haven't setup any recurring transactions. Automate your tracking to save time.</p>
        </div>
      )}

      <CreateRecurringModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
