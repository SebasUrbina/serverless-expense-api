'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import { MonthSelector } from '@/components/MonthSelector';
import { MenuChip, ToggleChip } from '@/components/FilterChip';
import { OptionList } from '@/components/ui/Popover';
import { useTags, useCategories, useGroups } from '@/hooks/usePreferences';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTransactionModal } from '@/store/useTransactionModal';
import { usePendingDeleteIds } from '@/store/usePendingDeletes';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/types/api';
import { transactionListOptions } from '@/lib/transactionList';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Card, CardNotice } from '@/components/ui/Card';
import { TransactionRow } from '@/components/TransactionRow';

const TYPE_LABELS: Record<string, string> = {
  expense: 'Gastos',
  income: 'Ingresos',
};

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingState minHeight="h-dvh" />}>
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

function sumBy(transactions: Transaction[], type: Transaction['type']) {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function groupTransactionsByDate(
  transactions: Transaction[],
): { date: string; label: string; items: Transaction[]; expense: number }[] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: formatGroupDate(date),
      items,
      expense: sumBy(items, 'expense'),
    }));
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get('month') || '';
  const initialCategory = searchParams.get('category_id')
    ? Number(searchParams.get('category_id'))
    : '';
  const initialShared = searchParams.get('shared') === '1';
  const initialGroupId = searchParams.get('group_id')
    ? Number(searchParams.get('group_id'))
    : '';

  const { openModal } = useTransactionModal();
  const categoryColors = useCategoryColors();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterType, setFilterType] = useState<Transaction['type'] | ''>('');
  const [filterCategory, setFilterCategory] = useState<number | ''>(
    initialCategory,
  );
  const [filterTag, setFilterTag] = useState<number | ''>('');
  const [filterShared, setFilterShared] = useState(initialShared);
  const [filterGroupId, setFilterGroupId] = useState<number | ''>(
    initialGroupId,
  );

  const { data: tagsData } = useTags();
  const tagsMap = new Map((tagsData?.tags || []).map((t) => [t.id, t.name]));
  const tagsList = tagsData?.tags || [];

  const { data: categoriesData } = useCategories();
  const categoriesList = categoriesData?.categories || [];
  const selectedCategory = categoriesList.find((c) => c.id === filterCategory);

  const { data: groupsData } = useGroups();
  const groupsList = groupsData?.groups || [];

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const {
    data: response,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(
    transactionListOptions(
      {
        search: debouncedSearch,
        month: filterMonth,
        type: filterType,
        category: filterCategory,
        tag: filterTag,
        shared: filterShared,
        group: filterGroupId,
      },
      async (url, signal) => (await api.get(url, { signal })).data,
    ),
  );

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetching || isError) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage({ cancelRefetch: false });
      },
      // The page scrolls inside the layout's <main>, not this list, so observe the viewport.
      { rootMargin: '0px 0px 250px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  const hiddenIds = [...usePendingDeleteIds()].join(',');
  const transactions = useMemo(() => {
    const seen = new Set<number>(
      hiddenIds ? hiddenIds.split(',').map(Number) : [],
    );
    return (response?.pages.flatMap((page) => page.transactions) ?? []).filter(
      (tx) => {
        if (seen.has(tx.id)) return false;
        seen.add(tx.id);
        return true;
      },
    );
  }, [response?.pages, hiddenIds]);
  const grouped = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions],
  );
  const activeFilterCount = [
    filterType !== '',
    filterCategory !== '',
    filterTag !== '',
    filterMonth !== '',
    filterShared,
    filterGroupId !== '',
  ].filter(Boolean).length;
  const isFiltered = activeFilterCount > 0 || !!debouncedSearch;
  const hasNoData = grouped.length === 0 && !isFiltered;

  const clearFilters = () => {
    setFilterMonth('');
    setFilterType('');
    setFilterCategory('');
    setFilterTag('');
    setFilterShared(false);
    setFilterGroupId('');
  };

  const totals = useMemo(
    () => ({
      expense: sumBy(transactions, 'expense'),
      income: sumBy(transactions, 'income'),
      myShare: transactions.some((tx) => tx.my_split_amount != null)
        ? transactions.reduce(
            (sum, tx) => sum + (tx.my_split_amount ?? tx.amount),
            0,
          )
        : null,
    }),
    [transactions],
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Movimientos"
        subtitle="Todo lo que entra y sale de tus cuentas."
        narrow
        primaryAction={{
          label: 'Agregar',
          icon: <Plus size={16} />,
          onClick: () => openModal(),
        }}
      >
        {!hasNoData && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                size={16}
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar movimientos"
                placeholder="Buscar un gasto o ingreso"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-card border-border text-primary placeholder:text-muted focus:border-secondary h-10 w-full rounded-xl border pr-9 pl-9 text-base transition-colors focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Borrar búsqueda"
                  onClick={() => setSearchTerm('')}
                  className="text-muted hover:text-primary focus-ring absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {!hasNoData && (
          <div
            role="group"
            aria-label="Filtros"
            className="flex flex-wrap items-center gap-2"
          >
            <MonthSelector
              variant="chip"
              value={filterMonth}
              onChange={setFilterMonth}
            />
            <MenuChip
              label={TYPE_LABELS[filterType] ?? 'Tipo'}
              menuLabel="Elegir tipo"
              active={filterType !== ''}
              onClear={() => setFilterType('')}
              panelWidth={200}
            >
              {(close) => (
                <OptionList
                  label="Tipo"
                  value={filterType}
                  options={[
                    { value: 'expense', label: 'Gastos' },
                    { value: 'income', label: 'Ingresos' },
                  ]}
                  onSelect={(value) => {
                    setFilterType(value);
                    const category = categoriesList.find(
                      (c) => c.id === filterCategory,
                    );
                    if (value && category && category.type !== value) {
                      setFilterCategory('');
                    }
                    close();
                  }}
                />
              )}
            </MenuChip>
            <MenuChip
              label={
                selectedCategory
                  ? `${selectedCategory.icon ? `${selectedCategory.icon} ` : ''}${selectedCategory.name}`
                  : 'Categoría'
              }
              menuLabel="Elegir categoría"
              active={filterCategory !== ''}
              onClear={() => setFilterCategory('')}
            >
              {(close) => (
                <OptionList
                  label="Categoría"
                  value={filterCategory}
                  options={categoriesList
                    .filter((c) => !filterType || c.type === filterType)
                    .map((c) => ({
                      value: c.id,
                      label: c.name,
                      icon: c.icon,
                      color: categoryColors.get(c.id),
                    }))}
                  onSelect={(value) => {
                    setFilterCategory(value);
                    close();
                  }}
                />
              )}
            </MenuChip>
            {tagsList.length > 0 && (
              <MenuChip
                label={
                  filterTag !== ''
                    ? (tagsMap.get(filterTag) ?? 'Etiqueta')
                    : 'Etiqueta'
                }
                menuLabel="Elegir etiqueta"
                active={filterTag !== ''}
                onClear={() => setFilterTag('')}
                panelWidth={224}
              >
                {(close) => (
                  <OptionList
                    label="Etiqueta"
                    value={filterTag}
                    options={tagsList.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                    onSelect={(value) => {
                      setFilterTag(value);
                      close();
                    }}
                  />
                )}
              </MenuChip>
            )}
            {groupsList.length > 0 && (
              <ToggleChip
                label="👥 Compartidos"
                active={filterShared}
                onToggle={() => {
                  setFilterShared((on) => !on);
                  setFilterGroupId('');
                }}
              />
            )}
            {filterShared && groupsList.length > 1 && (
              <MenuChip
                label={
                  groupsList.find((g) => g.id === filterGroupId)?.name ??
                  'Grupo'
                }
                menuLabel="Elegir grupo"
                active={filterGroupId !== ''}
                onClear={() => setFilterGroupId('')}
                panelWidth={224}
              >
                {(close) => (
                  <OptionList
                    label="Grupo"
                    value={filterGroupId}
                    options={groupsList.map((g) => ({
                      value: g.id,
                      label: g.name,
                    }))}
                    onSelect={(value) => {
                      setFilterGroupId(value);
                      close();
                    }}
                  />
                )}
              </MenuChip>
            )}
            {activeFilterCount > 1 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-secondary hover:text-primary focus-ring h-9 rounded-full px-2 text-[13px] font-semibold transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {(isFiltered || filterShared) &&
            !isLoading &&
            transactions.length > 0 && (
              <p
                aria-live="polite"
                className="text-secondary mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] tabular-nums"
              >
                <span>
                  <b className="text-primary font-semibold">
                    {transactions.length}
                  </b>{' '}
                  {transactions.length === 1 ? 'movimiento' : 'movimientos'}
                  {hasNextPage ? ' cargados' : ''}
                </span>
                {totals.expense > 0 && (
                  <span>
                    Gastos{' '}
                    <b className="text-primary font-semibold">
                      −${formatCurrency(totals.expense)}
                    </b>
                  </span>
                )}
                {totals.income > 0 && (
                  <span>
                    Ingresos{' '}
                    <b className="text-income font-semibold">
                      +${formatCurrency(totals.income)}
                    </b>
                  </span>
                )}
                {filterShared && totals.myShare !== null && (
                  <span>
                    Tu parte{' '}
                    <b className="text-primary font-semibold">
                      ${formatCurrency(totals.myShare)}
                    </b>
                  </span>
                )}
              </p>
            )}

          {isLoading ? (
            <LoadingState minHeight="h-48" />
          ) : isError && transactions.length === 0 ? (
            <Card label="Error">
              <CardNotice
                title="No pudimos cargar tus movimientos"
                description="Revisa tu conexión e intenta nuevamente."
                action={{ label: 'Reintentar', onClick: () => void refetch() }}
              />
            </Card>
          ) : grouped.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {grouped.map(({ date, label, items, expense }) => (
                <section
                  key={date}
                  aria-label={label}
                  className="bg-card border-border rounded-3xl border px-5 py-3 shadow-sm sm:px-6"
                >
                  <h2 className="flex items-baseline justify-between gap-3 py-2">
                    <span className="text-primary text-sm font-semibold capitalize">
                      {label}
                    </span>
                    {expense > 0 && (
                      <span className="text-muted text-xs tabular-nums">
                        −${formatCurrency(expense)}
                      </span>
                    )}
                  </h2>
                  <ul className="divide-border divide-y">
                    {items.map((tx) => (
                      <li key={tx.id} className="py-0.5">
                        <TransactionRow
                          transaction={tx}
                          tagNames={
                            tx.tag_names?.length
                              ? tx.tag_names
                              : (tx.tag_ids ?? []).map(
                                  (id) => tagsMap.get(id) || 'Desconocido',
                                )
                          }
                          onSelect={
                            tx.is_owner === false ? undefined : openModal
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <Card label="Sin movimientos">
              {isFiltered ? (
                <CardNotice
                  title="No encontramos movimientos"
                  description="Prueba con otra búsqueda o quita algunos filtros."
                  action={{
                    label: 'Limpiar búsqueda y filtros',
                    onClick: () => {
                      setSearchTerm('');
                      clearFilters();
                    },
                  }}
                />
              ) : (
                <CardNotice
                  title="Aún no tienes movimientos"
                  description="Registra tu primer gasto o ingreso para empezar a ver en qué se va tu dinero."
                  action={{
                    label: 'Agregar movimiento',
                    onClick: () => openModal(),
                  }}
                />
              )}
            </Card>
          )}

          {transactions.length > 0 && (
            <div
              ref={loadMoreRef}
              className="text-muted flex min-h-20 flex-col items-center justify-center gap-2 py-4 text-center text-xs"
              aria-live="polite"
            >
              {isFetchingNextPage ? (
                <span role="status" className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Cargando más
                  movimientos…
                </span>
              ) : isError ? (
                <>
                  <p role="alert">
                    No pudimos cargar{' '}
                    {isFetchNextPageError
                      ? 'más movimientos'
                      : 'los movimientos actualizados'}
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void (isFetchNextPageError
                        ? fetchNextPage({ cancelRefetch: false })
                        : refetch())
                    }
                    disabled={isFetching}
                    className="text-accent focus-ring rounded-xl px-4 py-2 font-semibold disabled:opacity-50"
                  >
                    Reintentar
                  </button>
                </>
              ) : hasNextPage ? (
                <button
                  type="button"
                  onClick={() => void fetchNextPage({ cancelRefetch: false })}
                  disabled={isFetching}
                  className="text-accent focus-ring rounded-xl px-4 py-2 font-semibold disabled:opacity-50"
                >
                  Cargar más movimientos
                </button>
              ) : (
                <p>Todos los movimientos cargados · {transactions.length}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
