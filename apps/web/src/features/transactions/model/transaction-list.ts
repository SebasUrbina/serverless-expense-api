import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Transaction } from '@/types/api';

export type TransactionDateGroup = {
  date: string;
  label: string;
  items: Transaction[];
};

export type TransactionSummary = {
  total: number;
  incomeTotal: number;
  expenseTotal: number;
  mySplitTotal: number;
  hasIncome: boolean;
  hasExpense: boolean;
  hasMySplit: boolean;
};

function formatGroupDate(dateValue: string): string {
  const date = parseISO(dateValue);
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
}

export function groupTransactionsByDate(
  transactions: Transaction[],
): TransactionDateGroup[] {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const date = transaction.date.slice(0, 10);
    const items = groups.get(date);
    if (items) items.push(transaction);
    else groups.set(date, [transaction]);
  }

  return [...groups.entries()]
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .map(([date, items]) => ({ date, label: formatGroupDate(date), items }));
}

export function summarizeTransactions(
  transactions: Transaction[],
): TransactionSummary {
  return transactions.reduce<TransactionSummary>(
    (summary, transaction) => {
      summary.total += transaction.amount;

      if (transaction.type === 'income') {
        summary.incomeTotal += transaction.amount;
        summary.hasIncome = true;
      } else {
        summary.expenseTotal += transaction.amount;
        summary.hasExpense = true;
      }

      if (transaction.my_split_amount != null) {
        summary.hasMySplit = true;
      }
      summary.mySplitTotal += transaction.my_split_amount ?? transaction.amount;
      return summary;
    },
    {
      total: 0,
      incomeTotal: 0,
      expenseTotal: 0,
      mySplitTotal: 0,
      hasIncome: false,
      hasExpense: false,
      hasMySplit: false,
    },
  );
}
