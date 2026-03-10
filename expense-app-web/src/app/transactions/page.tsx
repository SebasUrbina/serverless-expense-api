'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Transaction } from '@/hooks/useDashboardData';
import { format, parseISO, endOfMonth, isValid, isToday, isYesterday } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Receipt, Plus, Search, SlidersHorizontal, X, User } from 'lucide-react';
import { MonthSelector } from '@/components/MonthSelector';
import Link from 'next/link';
import { useTags, useCategories } from '@/hooks/usePreferences';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/CustomSelect';
import { useTransactionModal } from '@/store/useTransactionModal';

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="px-4 py-8 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}

function formatGroupDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
}

function groupTransactionsByDate(transactions: Transaction[]): { date: string; label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10); // YYYY-MM-DD
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, label: formatGroupDate(date), items }));
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get('month') || '';

  const { openModal } = useTransactionModal();
  const [showFilters, setShowFilters] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const initialCategory = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : '';

  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterCategory, setFilterCategory] = useState<number | ''>(initialCategory);
  const [filterTag, setFilterTag] = useState<number | ''>('');

  const { data: tagsData } = useTags();
  const tagsMap = new Map((tagsData?.tags || []).map(t => [t.id, t.name]));
  const tagsList = tagsData?.tags || [];

  const { data: categoriesData } = useCategories();
  const categoriesList = categoriesData?.categories || [];

  const { data: response, isLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['transactions', 'list', debouncedSearch, filterMonth, filterCategory, filterTag],
    queryFn: async () => {
      let url = debouncedSearch
        ? `/transactions?limit=50&search=${encodeURIComponent(debouncedSearch)}`
        : '/transactions?limit=50';

      if (filterCategory !== '') url += `&category_id=${filterCategory}`;
      if (filterTag !== '') url += `&tag_id=${filterTag}`;

      if (filterMonth) {
        const start = `${filterMonth}-01`;
        const dateObj = parseISO(start);
        if (isValid(dateObj)) {
          const end = format(endOfMonth(dateObj), 'yyyy-MM-dd');
          url += `&startDate=${start}&endDate=${end}`;
        }
      }

      const res = await api.get(url);
      return res.data;
    }
  });

  const transactions = response?.transactions || [];
  const grouped = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  const activeFilterCount = [filterCategory !== '', filterTag !== '', filterMonth !== ''].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Transactions</h1>
            <p className="text-zinc-500 text-sm mt-0.5 hidden sm:block">View and manage your financial activity.</p>
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
              <span>Add New</span>
            </button>
          </div>
        </div>

        {/* ── Search + Filter Toggle Row ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 w-full transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Expandable Filters ── */}
        {showFilters && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-200 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-2.5 flex flex-wrap items-center gap-2.5">
            <div className="flex-1 min-w-[140px]">
              <MonthSelector
                value={filterMonth}
                onChange={setFilterMonth}
                className="w-full"
                alignDropdown="left"
              />
            </div>
            <div className="flex-1 min-w-[140px] z-20">
              <CustomSelect
                value={filterCategory}
                onChange={setFilterCategory}
                placeholder="All Categories"
                size="small"
                options={[
                  { value: '', label: 'All Categories' },
                  ...categoriesList.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))
                ]}
              />
            </div>
            <div className="flex-1 min-w-[120px] z-10">
              <CustomSelect
                value={filterTag}
                onChange={setFilterTag}
                placeholder="All Tags"
                size="small"
                options={[
                  { value: '', label: 'All Tags' },
                  ...tagsList.map(t => ({ value: t.id, label: t.name }))
                ]}
              />
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterMonth(''); setFilterCategory(''); setFilterTag(''); }}
                className="text-xs font-medium text-zinc-500 hover:text-white transition-colors px-3 py-2 h-[42px] rounded-xl hover:bg-zinc-800/50 flex items-center justify-center gap-1.5 self-center shrink-0 border border-transparent hover:border-zinc-700/50"
              >
                <X size={14} /> Clear list
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Transaction List ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
          </div>
        ) : grouped.length > 0 ? (
          <div className="space-y-6">
            {grouped.map(({ date, label, items }) => (
              <div key={date}>
                {/* Date Group Header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs text-zinc-600">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map((tx) => {
                    const canEdit = tx.is_owner !== false;
                    return (
                      <div
                        key={tx.id}
                        onClick={() => {
                          if (!canEdit) return;
                          openModal(tx);
                        }}
                        className={`
                          bg-zinc-900 border border-zinc-800/60 rounded-2xl px-4 py-3.5
                          flex items-center gap-3 min-h-[68px]
                          transition-all duration-150
                          ${canEdit
                            ? 'cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-700 active:scale-[0.99]'
                            : 'cursor-default'}
                        `}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          tx.category_icon
                            ? 'bg-zinc-800'
                            : tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.category_icon
                            ? <span>{tx.category_icon}</span>
                            : tx.type === 'income'
                              ? <ArrowUpRight size={18} />
                              : <ArrowDownRight size={18} />
                          }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-white font-medium text-sm leading-tight truncate">{tx.title}</p>
                            {!!tx.is_shared && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-bold border border-violet-500/20 flex-shrink-0">
                                👥 {tx.group_name || 'Split'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {tx.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700/40">
                                {tx.category}
                              </span>
                            )}
                            {(tx.tag_names && tx.tag_names.length > 0
                              ? tx.tag_names
                              : tx.tag_ids?.map((id: number) => tagsMap.get(id) || 'Unknown') || []
                            ).map((name: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-[10px] text-zinc-500 font-medium border border-zinc-700/30">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('es-CL')}
                          </p>
                          {!!tx.is_shared && tx.my_split_amount != null && (
                            <p className="text-violet-400 text-xs mt-0.5">
                              ${tx.my_split_amount.toLocaleString('es-CL')} ({tx.my_split_percentage}%)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-center">
            <Receipt className="w-14 h-14 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-zinc-400 mb-1">
              {debouncedSearch ? 'No matches found' : 'No transactions found'}
            </h3>
            <p className="text-sm max-w-xs text-zinc-600">
              {debouncedSearch
                ? `No transaction matched "${debouncedSearch}".`
                : 'Once you start tracking, they\'ll appear here.'}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
