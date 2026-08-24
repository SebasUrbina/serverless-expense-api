import type { Account, Category, Tag } from '@/types/api';

type SelectorProps = {
  idPrefix: string;
  isLoading: boolean;
};

export function CategorySelector({
  idPrefix,
  categories,
  type,
  selectedId,
  onChange,
  isLoading,
}: SelectorProps & {
  categories: Category[];
  type: Category['type'];
  selectedId: number | '';
  onChange: (id: number) => void;
}) {
  const labelId = `${idPrefix}-category-label`;

  return (
    <div>
      <p id={labelId} className="text-secondary mb-3 text-sm font-semibold">
        Categoría
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="bg-inset aspect-square animate-pulse rounded-2xl"
              />
            ))
          : categories
              .filter((category) => category.type === type)
              .map((category) => {
                const isSelected = selectedId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange(category.id)}
                    className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 pt-4 pb-3 transition-all ${
                      isSelected
                        ? 'scale-[1.02] border-orange-400/50 bg-orange-500/10 shadow-sm'
                        : 'bg-card border-border hover:bg-card-hover'
                    }`}
                  >
                    <span className="mb-1 text-2xl">
                      {category.icon || '🏷️'}
                    </span>
                    <span
                      className={`px-1 text-center text-[9px] leading-tight font-bold tracking-wide uppercase sm:text-[10px] ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-primary'}`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
      </div>
    </div>
  );
}

const accountIcons: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  checking: '🏦',
  savings: '🏦',
  credit: '💳',
  investment: '📈',
};

export function AccountSelector({
  idPrefix,
  accounts,
  selectedId,
  onChange,
  isLoading,
}: SelectorProps & {
  accounts: Account[];
  selectedId: number | '';
  onChange: (id: number) => void;
}) {
  const labelId = `${idPrefix}-account-label`;

  return (
    <div>
      <p id={labelId} className="text-secondary mb-3 text-sm font-semibold">
        Cuenta
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="bg-inset h-16 animate-pulse rounded-2xl"
              />
            ))
          : accounts.map((account) => {
              const isSelected = selectedId === account.id;
              return (
                <button
                  key={account.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange(account.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2 pt-3 pb-2 transition-all ${
                    isSelected
                      ? 'scale-[1.02] border-blue-400/50 bg-blue-500/10 shadow-sm'
                      : 'bg-card border-border hover:bg-card-hover'
                  }`}
                >
                  <span className="mb-1 text-xl">
                    {accountIcons[account.type.toLowerCase()] || '💰'}
                  </span>
                  <span
                    className={`px-1 text-center text-[9px] leading-tight font-bold tracking-wide uppercase sm:text-[10px] ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}
                  >
                    {account.name}
                  </span>
                </button>
              );
            })}
      </div>
    </div>
  );
}

export function TagSelector({
  idPrefix,
  tags,
  selectedIds,
  onChange,
  isLoading,
}: SelectorProps & {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const labelId = `${idPrefix}-tags-label`;

  return (
    <div>
      <p
        id={labelId}
        className="text-secondary mb-2 ml-1 text-[10px] font-bold uppercase"
      >
        Tags
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex flex-wrap gap-2"
      >
        {isLoading ? (
          <div className="bg-inset h-8 w-full animate-pulse rounded-lg" />
        ) : (
          tags.map((tag) => {
            const isSelected = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onChange(
                    isSelected
                      ? selectedIds.filter((id) => id !== tag.id)
                      : [...selectedIds, tag.id],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-card border-primary scale-105 shadow-sm'
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
  );
}
