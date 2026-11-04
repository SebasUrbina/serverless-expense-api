import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import type { Transaction } from '@/types/api';
import { InstallmentBadge, TransactionTitle } from './TransactionTitle';

const rowClass =
  '-mx-2 grid min-h-14 w-[calc(100%+1rem)] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2.5 text-left';

export function TransactionRow({
  transaction: tx,
  tagNames = [],
  showDate = false,
  onSelect,
}: {
  transaction: Transaction;
  tagNames?: string[];
  showDate?: boolean;
  /** Omitted for rows the user can't edit (e.g. shared by someone else). */
  onSelect?: (tx: Transaction) => void;
}) {
  const income = tx.type === 'income';
  const categoryColor =
    useCategoryColors().get(tx.category_id) ?? 'var(--text-muted)';
  const meta = [
    tx.category,
    tx.is_shared ? `👥 ${tx.group_name || 'Compartido'}` : null,
    ...tagNames,
    showDate ? format(parseISO(tx.date), 'd MMM', { locale: es }) : null,
  ].filter(Boolean);

  const content = (
    <>
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{
          background: `color-mix(in srgb, ${categoryColor} 18%, transparent)`,
          color: categoryColor,
        }}
      >
        {tx.category_icon ||
          (income ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />)}
      </span>
      <span className="min-w-0">
        <TransactionTitle transaction={tx} />
        <span className="mt-1 flex min-w-0 items-center gap-1.5">
          <InstallmentBadge transaction={tx} />
          <span className="text-muted truncate text-xs">
            {meta.join(' · ')}
          </span>
        </span>
      </span>
      <span className="text-right tabular-nums">
        <span
          className={`block text-sm font-semibold ${income ? 'text-income' : 'text-primary'}`}
        >
          {income ? '+' : '−'}${formatCurrency(tx.amount)}
        </span>
        {!!tx.is_shared && tx.my_split_amount != null && (
          <span className="text-muted mt-0.5 block text-xs">
            Tu parte ${formatCurrency(tx.my_split_amount)}
          </span>
        )}
      </span>
    </>
  );

  if (!onSelect) return <div className={rowClass}>{content}</div>;
  return (
    <button
      type="button"
      onClick={() => onSelect(tx)}
      className={`${rowClass} hover:bg-inset focus-ring transition-colors`}
    >
      {content}
    </button>
  );
}
