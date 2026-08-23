import { addMonths, format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  CategorySummary,
  CategoryTrendResponse,
  MonthlySummary,
} from '@/types/api';

export type ChartDatum = {
  name: string;
  originalMonth: string;
  Ingresos: number;
  Gastos: number;
  Balance: number;
};

export type SavingsDatum = {
  name: string;
  Ahorro: number;
  isProjection: boolean;
};

function monthLabel(month: string) {
  const parsed = parseISO(`${month}-01`);
  return isValid(parsed) ? format(parsed, 'MMM', { locale: es }) : month;
}

export function buildCategoryTrendData(response?: CategoryTrendResponse) {
  const months = response?.months ?? [];
  const categories = response?.categories ?? [];
  const topCategories = categories.slice(0, 6);
  const otherCategories = categories.slice(6);

  const data = months.map((month, index) => {
    const datum: Record<string, number | string> = {
      name: monthLabel(month),
    };
    for (const category of topCategories) {
      datum[category.category ?? 'Sin categoría'] =
        category.values[index] ?? 0;
    }
    const otherTotal = otherCategories.reduce(
      (total, category) => total + (category.values[index] ?? 0),
      0,
    );
    if (otherTotal > 0) datum.Otros = otherTotal;
    return datum;
  });

  return { data, topCategories, hasOthers: otherCategories.length > 0 };
}

export function buildMonthlyChartData(summary: MonthlySummary[]): ChartDatum[] {
  return summary
    .filter((item) => item.month)
    .map((item) => ({
      name: monthLabel(item.month),
      originalMonth: item.month,
      Ingresos: item.total_income,
      Gastos: item.total_expense,
      Balance: Math.max(0, item.total_income - item.total_expense),
    }));
}

export function buildSavingsData(
  chartData: ChartDatum[],
  includeProjection: boolean,
): SavingsDatum[] {
  const data = chartData.map((item) => ({
    name: item.name,
    Ahorro: item.Balance,
    isProjection: false,
  }));
  if (!includeProjection || chartData.length === 0) return data;

  const recent = chartData.slice(-3);
  const average =
    recent.reduce((total, item) => total + item.Balance, 0) / recent.length;
  const lastMonth = chartData.at(-1)?.originalMonth;
  if (!lastMonth) return data;

  const lastDate = parseISO(`${lastMonth}-01`);
  if (!isValid(lastDate)) return data;
  data.push({
    name: `${format(addMonths(lastDate, 1), 'MMM', { locale: es })} (est.)`,
    Ahorro: average,
    isProjection: true,
  });
  return data;
}

export function deriveAnalyticsMetrics(
  monthlySummary: MonthlySummary[],
  categorySummary: CategorySummary[],
  month: string,
) {
  const selected = monthlySummary.find((item) => item.month === month);
  const income = selected?.total_income ?? 0;
  const expense = selected?.total_expense ?? 0;
  const savings = income - expense;
  const parsedMonth = month ? parseISO(`${month}-01`) : null;
  const daysInMonth =
    parsedMonth && isValid(parsedMonth)
      ? new Date(parsedMonth.getFullYear(), parsedMonth.getMonth() + 1, 0).getDate()
      : 30;

  return {
    selectedIncome: income,
    selectedExpense: expense,
    selectedSavings: savings,
    savingsRate: income > 0 ? (savings / income) * 100 : 0,
    daysInMonth,
    dailyAverage: expense / daysInMonth,
    totalExpense: categorySummary.reduce(
      (total, category) => total + category.amount,
      0,
    ),
    topCategory: categorySummary[0] ?? null,
  };
}
