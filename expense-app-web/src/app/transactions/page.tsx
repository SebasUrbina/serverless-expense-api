'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Transaction } from '@/hooks/useDashboardData';
import { format, parseISO, endOfMonth, isValid, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Receipt, Plus, Search, SlidersHorizontal, X, Settings, Users } from 'lucide-react';
import { MonthSelector } from '@/components/MonthSelector';
import Link from 'next/link';
import { useTags, useCategories, useGroups } from '@/hooks/usePreferences';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/CustomSelect';
import { useTransactionModal } from '@/store/useTransactionModal';
import { formatCurrency } from '@/lib/utils';

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="px-4 py-8 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}

function formatGroupDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
}

function groupTransactionsByDate(transactions: Transaction[]): { date: string; label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10);
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
  const initialCategory = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : '';
  const initialShared = searchParams.get('shared') === '1';
  const initialGroupId = searchParams.get('group_id') ? Number(searchParams.get('group_id')) : '';

  const { openModal } = useTransactionModal();
  const [showFilters, setShowFilters] = useState(!!initialMonth || !!initialCategory || initialShared);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterCategory, setFilterCategory] = useState<number | ''>(initialCategory);
  const [filterTag, setFilterTag] = useState<number | ''>('');
  const [filterShared, setFilterShared] = useState(initialShared);
  const [filterGroupId, setFilterGroupId] = useState<number | ''>(initialGroupId);

  const { data: tagsData } = useTags();
  const tagsMap = new Map((tagsData?.tags || []).map(t => [t.id, t.name]));
  const tagsList = tagsData?.tags || [];

  const { data: categoriesData } = useCategories();
  const categoriesList = categoriesData?.categories || [];

  const { data: groupsData } = useGroups();
  const groupsList = groupsData?.groups || [];

  const { data: response, isLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['transactions', 'list', debouncedSearch, filterMonth, filterCategory, filterTag, filterShared, filterGroupId],
    queryFn: async () => {
      let url = debouncedSearch
        ? `/transactions?limit=50&search=${encodeURIComponent(debouncedSearch)}`
        : '/transactions?limit=50';
      if (filterCategory !== '') url += `&category_id=${filterCategory}`;
      if (filterTag !== '') url += `&tag_id=${filterTag}`;
      if (filterShared) url += `&is_shared=1`;
      if (filterGroupId !== '') url += `&group_id=${filterGroupId}`;
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

  const transactions = useMemo(() => response?.transactions ?? [], [response?.transactions]);
  const grouped = useMemo(() => groupTransactionsByDate(transactions), [transactions]);
  const activeFilterCount = [filterCategory !== '', filterTag !== '', filterMonth !== '', filterShared, filterGroupId !== ''].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Mis movimientos
            </h1>
            <p className="text-sm mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              Todo lo que entra y sale de tus cuentas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="sm:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              aria-label="Ajustes"
            >
              <Settings size={18} />
            </Link>
            <button
              onClick={() => openModal()}
              className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors items-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Plus size={16} />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Search + Filter Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar un gasto o ingreso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: (showFilters || activeFilterCount > 0) ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
              border: `1px solid ${(showFilters || activeFilterCount > 0) ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              color: (showFilters || activeFilterCount > 0) ? '#10b981' : 'var(--text-secondary)',
            }}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-200 flex flex-wrap items-center gap-2 pt-1">
            <div className="flex-1 min-w-[130px]">
              <MonthSelector value={filterMonth} onChange={setFilterMonth} className="w-full" alignDropdown="left" />
            </div>
            <div className="flex-1 min-w-[140px] z-20">
              <CustomSelect
                value={filterCategory}
                onChange={(value) => setFilterCategory(value === '' ? '' : Number(value))}
                placeholder="Todas las categorías"
                size="small"
                options={[
                  { value: '', label: 'Todas las categorías' },
                  ...categoriesList.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))
                ]}
              />
            </div>
            <div className="flex-1 min-w-[130px] z-10">
              <CustomSelect
                value={filterTag}
                onChange={(value) => setFilterTag(value === '' ? '' : Number(value))}
                placeholder="Todas las etiquetas"
                size="small"
                options={[
                  { value: '', label: 'Todas las etiquetas' },
                  ...tagsList.map(t => ({ value: t.id, label: t.name }))
                ]}
              />
            </div>
            {filterShared && groupsList.length > 0 && (
              <div className="flex-1 min-w-[130px] z-[5]">
                <CustomSelect
                  value={filterGroupId}
                  onChange={(value) => setFilterGroupId(value === '' ? '' : Number(value))}
                  placeholder="Todos los grupos"
                  size="small"
                  options={[
                    { value: '', label: 'Todos los grupos' },
                    ...groupsList.map(g => ({ value: g.id, label: `👥 ${g.name}` }))
                  ]}
                />
              </div>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterMonth(''); setFilterCategory(''); setFilterTag(''); setFilterShared(false); setFilterGroupId(''); }}
                className="text-xs font-semibold px-3 py-2 h-[42px] rounded-xl flex items-center justify-center gap-1.5 self-center shrink-0 transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                <X size={13} /> Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Transaction List ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Shared transactions summary banner */}
          {filterShared && !isLoading && transactions.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Users size={16} className="text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-violet-400">
                  {transactions.length} gasto{transactions.length !== 1 ? 's' : ''} compartido{transactions.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                  Total: <span className="font-bold text-violet-400">${formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}</span>
                  {transactions.some(tx => tx.my_split_amount != null) && (
                    <> · Tu parte: <span className="font-bold text-violet-400">${formatCurrency(transactions.reduce((sum, tx) => sum + (tx.my_split_amount ?? tx.amount), 0))}</span></>
                  )}
                </span>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
            </div>
          ) : grouped.length > 0 ? (
            <div className="space-y-6">
              {grouped.map(({ date, label, items }) => (
                <div key={date}>
                  {/* Date Group Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold capitalize" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {items.length} {items.length === 1 ? 'movimiento' : 'movimientos'}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {items.map((tx) => {
                      const canEdit = tx.is_owner !== false;
                      return (
                        <div
                          key={tx.id}
                          onClick={() => { if (!canEdit) return; openModal(tx); }}
                          className="rounded-2xl px-4 py-3.5 flex items-center gap-3 min-h-[68px] transition-all duration-150"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            cursor: canEdit ? 'pointer' : 'default',
                          }}
                        >
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            tx.category_icon ? '' : tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`} style={tx.category_icon ? { background: 'var(--bg-inset)' } : {}}>
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
                              <p className="font-medium text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                {tx.title}
                              </p>
                              {!!tx.is_shared && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-bold border border-violet-500/20 flex-shrink-0">
                                  👥 {tx.group_name || 'Compartido'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {tx.category && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                  style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                >
                                  {tx.category}
                                </span>
                              )}
                              {(tx.tag_names && tx.tag_names.length > 0
                                ? tx.tag_names
                                : tx.tag_ids?.map((id: number) => tagsMap.get(id) || 'Desconocido') || []
                              ).map((name: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                                  style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="flex-shrink-0 text-right">
                            <p
                              className="font-bold text-sm"
                              style={{ color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}
                            >
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
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Receipt className="w-12 h-12 mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                {debouncedSearch ? 'Nada encontrado' : 'Aún no hay movimientos'}
              </h3>
              <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                {debouncedSearch
                  ? `No encontramos nada con "${debouncedSearch}".`
                  : 'Cuando empieces a registrar, aparecerán aquí.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
