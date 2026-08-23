import { format, isValid, parseISO, subMonths } from 'date-fns';
import type { CategorySummary, MonthlySummary } from '@/types/api';

export function deriveDashboardMetrics({
  month,
  monthlySummary,
  categorySummary,
  selectedMonth,
}: {
  month: string;
  monthlySummary: MonthlySummary[];
  categorySummary: CategorySummary[];
  selectedMonth: MonthlySummary | null | undefined;
}) {
  const expense = month
    ? (selectedMonth?.total_expense ?? 0)
    : monthlySummary.reduce((total, item) => total + item.total_expense, 0);
  const income = month
    ? (selectedMonth?.total_income ?? 0)
    : monthlySummary.reduce((total, item) => total + item.total_income, 0);

  const previousDate = subMonths(parseISO(`${month}-01`), 1);
  const previousMonth = isValid(previousDate)
    ? format(previousDate, 'yyyy-MM')
    : null;
  const previousExpense =
    monthlySummary.find((item) => item.month === previousMonth)?.total_expense ??
    0;
  const expenseDelta =
    previousExpense > 0
      ? ((expense - previousExpense) / previousExpense) * 100
      : expense > 0
        ? 100
        : 0;

  return {
    expense,
    income,
    previousExpense,
    expenseDelta,
    totalExpense: categorySummary.reduce(
      (total, category) => total + category.amount,
      0,
    ),
  };
}
