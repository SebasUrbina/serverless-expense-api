'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Repeat, Plus, Calendar, Zap, TrendingUp, TrendingDown, User } from 'lucide-react';
import { useRecurringModal } from '@/store/useRecurringModal';
import Link from 'next/link';

export type RecurringRule = {
  id: number;
  title: string;
  amount: number;
  category: string;
  category_icon?: string;
  type: 'expense' | 'income';
  account: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  next_run: string;
  is_active: number;
};

const frequencyLabel: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const frequencyColors: Record<string, string> = {
  daily: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  weekly: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  monthly: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yearly: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function RecurringPage() {
  const { openModal } = useRecurringModal();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery<{ rules: RecurringRule[] }>({
    queryKey: ['recurring', 'list'],
    queryFn: async () => {
      const res = await api.get('/recurring');
      return res.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: number }) => {
      const res = await api.put(`/recurring/${id}`, { is_active });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const rules = response?.rules || [];
  const activeRules = rules.filter(r => r.is_active === 1);
  const inactiveRules = rules.filter(r => r.is_active !== 1);

  const totalMonthlyExpenses = activeRules
    .filter(r => r.type === 'expense' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMonthlyIncome = activeRules
    .filter(r => r.type === 'income' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Recurring</h1>
            <p className="text-zinc-500 text-sm mt-0.5 hidden sm:block">
              Automate subscriptions, salaries & payments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white sm:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
              aria-label="Settings"
            >
              <User size={18} />
            </Link>
            <button
              onClick={() => openModal()}
              className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors items-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Plus size={16} />
              <span>New Rule</span>
            </button>
          </div>
        </div>

        {/* ── Summary Pills ── */}
        {rules.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <Zap size={14} className="text-emerald-400" />
              <span className="text-xs text-zinc-400">{activeRules.length} active</span>
            </div>
            {totalMonthlyExpenses > 0 && (
              <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2">
                <TrendingDown size={14} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">
                  −${totalMonthlyExpenses.toLocaleString('es-CL')}/mo
                </span>
              </div>
            )}
            {totalMonthlyIncome > 0 && (
              <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">
                  +${totalMonthlyIncome.toLocaleString('es-CL')}/mo
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
            </div>
          ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Repeat className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-400 mb-1">No rules yet</h3>
            <p className="text-sm text-zinc-600 max-w-xs">
              Set up recurring transactions to automate your tracking and save time.
            </p>
            <button
              onClick={() => openModal()}
              className="mt-5 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus size={15} /> Create first rule
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Rules */}
            {activeRules.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {activeRules.map(rule => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      onToggle={() => toggleMutation.mutate({ id: rule.id, is_active: rule.is_active === 1 ? 0 : 1 })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Rules */}
            {inactiveRules.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Paused</span>
                  <div className="flex-1 h-px bg-zinc-800/60" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                  {inactiveRules.map(rule => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      onToggle={() => toggleMutation.mutate({ id: rule.id, is_active: rule.is_active === 1 ? 0 : 1 })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule, onToggle }: { rule: RecurringRule; onToggle: () => void }) {
  const isIncome = rule.type === 'income';
  const freqColor = frequencyColors[rule.frequency] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  const { openModal } = useRecurringModal();

  return (
    <div 
      onClick={() => openModal(rule)}
      className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col gap-4 transition-all duration-150 hover:border-zinc-700 cursor-pointer ${
      rule.is_active === 1 ? 'border-zinc-800' : 'border-zinc-800/50'
    }`}>
      {/* Top Row: icon + title + status toggle */}
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          rule.category_icon
            ? 'bg-zinc-800'
            : isIncome
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-red-500/10 text-red-500'
        }`}>
          {rule.category_icon
            ? <span>{rule.category_icon}</span>
            : isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{rule.title}</p>
          {rule.category && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700/40">
              {rule.category}
            </span>
          )}
        </div>

        {/* Active toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={rule.is_active === 1 ? 'Pause rule' : 'Activate rule'}
          className={`flex-shrink-0 w-9 h-5 rounded-full transition-colors relative ${
            rule.is_active === 1 ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
            rule.is_active === 1 ? 'left-4' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Amount + Frequency */}
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
            {isIncome ? '+' : '−'}${rule.amount.toLocaleString('es-CL')}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${freqColor}`}>
              <Repeat size={10} />
              {frequencyLabel[rule.frequency]}
              {rule.frequency === 'monthly' && rule.day_of_month ? ` · day ${rule.day_of_month}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Next Run */}
      <div className="flex items-center gap-2 bg-black/40 border border-zinc-800/50 rounded-xl px-3 py-2">
        <Calendar size={13} className="text-zinc-500 flex-shrink-0" />
        <span className="text-zinc-500 text-xs">Next run</span>
        <span className="text-zinc-300 text-xs font-semibold ml-auto">
          {format(parseISO(rule.next_run), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}
