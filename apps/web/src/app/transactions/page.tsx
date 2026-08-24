'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Users,
  Sparkles,
} from 'lucide-react';
import { MonthSelector } from '@/components/MonthSelector';
import {
  useTags,
  useCategories,
  useGroups,
} from '@/features/preferences/hooks';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { CustomSelect } from '@/components/CustomSelect';
import { useTransactionModal } from '@/store/useTransactionModal';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useTransactionFilters } from '@/features/transactions/hooks/useTransactionFilters';
import {
  groupTransactionsByDate,
  summarizeTransactions,
} from '@/features/transactions/model/transaction-list';

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingState minHeight="h-dvh" />}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const { openModal } = useTransactionModal();
  const { filters, setFilters, clearFilters } = useTransactionFilters();
  const [showFilters, setShowFilters] = useState(
    !!filters.month || !!filters.categoryId || filters.shared,
  );

  const { data: tagsData } = useTags();
  const tagsMap = new Map((tagsData?.tags || []).map((t) => [t.id, t.name]));
  const tagsList = tagsData?.tags || [];

  const { data: categoriesData } = useCategories();
  const categoriesList = categoriesData?.categories || [];

  const { data: groupsData } = useGroups();
  const groupsList = groupsData?.groups || [];

  const {
    data: response,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTransactions(filters);

  const transactions = useMemo(
    () => response?.pages.flatMap((page) => page.transactions) ?? [],
    [response?.pages],
  );
  const grouped = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions],
  );
  const summary = useMemo(
    () => summarizeTransactions(transactions),
    [transactions],
  );
  const activeFilterCount = [
    filters.categoryId !== '',
    filters.tagId !== '',
    filters.month !== '',
    filters.shared,
    filters.groupId !== '',
  ].filter(Boolean).length;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <PageHeader
        title="Mis movimientos"
        subtitle="Todo lo que entra y sale de tus cuentas."
        primaryAction={{
          label: 'Agregar',
          icon: <Plus size={16} />,
          onClick: () => openModal(),
        }}
      >
        {/* Search + Filter Toggle */}
        {!(
          grouped.length === 0 &&
          !filters.search &&
          activeFilterCount === 0
        ) && (
          <div className="flex gap-2">
            <TransactionSearchInput
              key={filters.search}
              initialValue={filters.search}
              onSearchChange={(search) => setFilters({ search })}
            />
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-card border-border text-secondary hover:text-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="bg-accent absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Expandable Filters */}
        {showFilters &&
          !(
            grouped.length === 0 &&
            !filters.search &&
            activeFilterCount === 0
          ) && (
            <div className="animate-in slide-in-from-top-4 fade-in flex flex-wrap items-center gap-2 pt-1 duration-200">
              <div className="min-w-[130px] flex-1">
                <MonthSelector
                  value={filters.month}
                  onChange={(month) => setFilters({ month })}
                  className="w-full"
                  alignDropdown="left"
                />
              </div>
              <div className="z-20 min-w-[140px] flex-1">
                <CustomSelect
                  value={filters.categoryId}
                  onChange={(value) =>
                    setFilters({
                      categoryId: value === '' ? '' : Number(value),
                    })
                  }
                  placeholder="Todas las categorías"
                  size="small"
                  options={[
                    { value: '', label: 'Todas las categorías' },
                    ...categoriesList.map((c) => ({
                      value: c.id,
                      label: `${c.icon || ''} ${c.name}`,
                    })),
                  ]}
                />
              </div>
              <div className="z-10 min-w-[130px] flex-1">
                <CustomSelect
                  value={filters.tagId}
                  onChange={(value) =>
                    setFilters({ tagId: value === '' ? '' : Number(value) })
                  }
                  placeholder="Todas las etiquetas"
                  size="small"
                  options={[
                    { value: '', label: 'Todas las etiquetas' },
                    ...tagsList.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>
              {filters.shared && groupsList.length > 0 && (
                <div className="z-[5] min-w-[130px] flex-1">
                  <CustomSelect
                    value={filters.groupId}
                    onChange={(value) =>
                      setFilters({
                        groupId: value === '' ? '' : Number(value),
                      })
                    }
                    placeholder="Todos los grupos"
                    size="small"
                    options={[
                      { value: '', label: 'Todos los grupos' },
                      ...groupsList.map((g) => ({
                        value: g.id,
                        label: `👥 ${g.name}`,
                      })),
                    ]}
                  />
                </div>
              )}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-[42px] shrink-0 items-center justify-center gap-1.5 self-center rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
                >
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>
          )}
      </PageHeader>

      {/* ── Transaction List ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {/* Shared transactions summary banner */}
          {filters.shared && !isLoading && transactions.length > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
              <Users size={16} className="shrink-0 text-violet-400" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-violet-400">
                  {transactions.length} gasto
                  {transactions.length !== 1 ? 's' : ''} compartido
                  {transactions.length !== 1 ? 's' : ''}
                </span>
                <span className="text-muted ml-2 text-xs">
                  Total:{' '}
                  <span className="font-bold text-violet-400">
                    ${formatCurrency(summary.total)}
                  </span>
                  {summary.hasMySplit && (
                    <>
                      {' '}
                      · Tu parte:{' '}
                      <span className="font-bold text-violet-400">
                        ${formatCurrency(summary.mySplitTotal)}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* General transactions summary banner when filters are active */}
          {!filters.shared &&
            (activeFilterCount > 0 || filters.search) &&
            !isLoading &&
            transactions.length > 0 && (
              <div className="bg-card border-border mb-4 flex flex-col justify-between gap-2 rounded-2xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-primary text-xs font-bold">
                    Resultados filtrados: {transactions.length}{' '}
                    {transactions.length === 1 ? 'movimiento' : 'movimientos'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  {summary.hasIncome && (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <ArrowUpRight size={14} />
                      Ingresos: ${formatCurrency(summary.incomeTotal)}
                    </span>
                  )}
                  {summary.hasExpense && (
                    <span className="flex items-center gap-1 text-red-500">
                      <ArrowDownRight size={14} />
                      Gastos: ${formatCurrency(summary.expenseTotal)}
                    </span>
                  )}
                </div>
              </div>
            )}
          {isLoading ? (
            <LoadingState minHeight="h-48" />
          ) : grouped.length > 0 ? (
            <>
              <div className="space-y-6">
                {grouped.map(({ date, label, items }) => (
                  <section key={date} className="transaction-date-group">
                    {/* Date Group Header */}
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-secondary text-xs font-semibold capitalize">
                        {label}
                      </span>
                      <div className="bg-border h-px flex-1" />
                      <span className="text-muted text-xs">
                        {items.length}{' '}
                        {items.length === 1 ? 'movimiento' : 'movimientos'}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {items.map((tx) => {
                        const canEdit = tx.is_owner !== false;
                        return (
                          <div
                            key={tx.id}
                            role={canEdit ? 'button' : undefined}
                            tabIndex={canEdit ? 0 : undefined}
                            aria-label={
                              canEdit
                                ? `Editar movimiento ${tx.title}`
                                : undefined
                            }
                            onClick={() => {
                              if (!canEdit) return;
                              openModal(tx);
                            }}
                            onKeyDown={(event) => {
                              if (!canEdit) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openModal(tx);
                              }
                            }}
                            className={`bg-card border-border flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-150 ${
                              canEdit
                                ? 'hover:bg-card-hover focus:ring-accent/40 cursor-pointer focus:ring-2 focus:outline-none'
                                : 'cursor-default'
                            }`}
                          >
                            {/* Icon */}
                            <div
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg ${
                                tx.category_icon
                                  ? 'bg-inset'
                                  : tx.type === 'income'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {tx.category_icon ? (
                                <span>{tx.category_icon}</span>
                              ) : tx.type === 'income' ? (
                                <ArrowUpRight size={18} />
                              ) : (
                                <ArrowDownRight size={18} />
                              )}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-primary truncate text-sm leading-tight font-medium">
                                  {tx.title}
                                </p>
                                {!!tx.is_shared && (
                                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
                                    👥 {tx.group_name || 'Compartido'}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {tx.category && (
                                  <span className="bg-inset text-secondary border-border inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                                    {tx.category}
                                  </span>
                                )}
                                {(tx.tag_names && tx.tag_names.length > 0
                                  ? tx.tag_names
                                  : tx.tag_ids?.map(
                                      (id: number) =>
                                        tagsMap.get(id) || 'Desconocido',
                                    ) || []
                                ).map((name: string, i: number) => (
                                  <span
                                    key={`${tx.id}-${name}-${i}`}
                                    className="bg-inset text-muted border-border rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="flex-shrink-0 text-right">
                              <p
                                className="text-sm font-bold"
                                style={{
                                  color:
                                    tx.type === 'income'
                                      ? 'var(--color-income)'
                                      : 'var(--color-expense)',
                                }}
                              >
                                {tx.type === 'income' ? '+' : '-'}$
                                {formatCurrency(tx.amount)}
                              </p>
                              {!!tx.is_shared && tx.my_split_amount != null && (
                                <p className="mt-0.5 text-xs text-violet-400">
                                  ${formatCurrency(tx.my_split_amount)} (
                                  {tx.my_split_percentage}%)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              {hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-card border-border text-secondary hover:text-primary rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Receipt className="h-9 w-9" />}
              secondaryIcon={
                !filters.search &&
                activeFilterCount === 0 && (
                  <Sparkles size={14} className="text-white" />
                )
              }
              title={
                filters.search || activeFilterCount > 0
                  ? 'Nada encontrado'
                  : 'Finanzas bajo control'
              }
              description={
                filters.search || activeFilterCount > 0
                  ? 'Prueba ajustando tus filtros de búsqueda.'
                  : 'Cuando empieces a registrar movimientos, aparecerán mágicamente aquí.'
              }
              actionButton={
                !filters.search &&
                activeFilterCount === 0 && (
                  <AnimatedButton
                    text="Primer movimiento"
                    onClick={() => openModal()}
                  />
                )
              }
              primaryColor={
                filters.search || activeFilterCount > 0 ? 'zinc' : 'emerald'
              }
              className="mt-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionSearchInput({
  initialValue,
  onSearchChange,
}: {
  initialValue: string;
  onSearchChange: (search: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(value), 400);
    return () => clearTimeout(timer);
  }, [onSearchChange, value]);

  return (
    <div className="relative flex-1">
      <Search
        className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
        size={15}
      />
      <input
        type="search"
        aria-label="Buscar movimientos"
        placeholder="Buscar un gasto o ingreso..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="bg-card border-border text-primary focus:ring-accent/30 w-full rounded-xl border py-2.5 pr-9 pl-9 text-base transition-all focus:ring-2 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Limpiar búsqueda"
          className="text-muted hover:text-primary absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
