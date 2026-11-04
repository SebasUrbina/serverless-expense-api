import type { CategoryTrendResponse, MonthlySummary } from '@/types/api';

/** Below this share of change a month reads as "in line" with the average. */
export const IN_LINE_PCT = 3;

/**
 * Compares a month's spending with the average of the earlier months that had
 * spending. While the month is in progress it compares with what those months
 * had spent by the same day (`expense_to_day`), since fixed costs land early.
 */
export function compareWithNormal(
  summary: MonthlySummary[],
  month: string,
  today: string,
) {
  const expense = summary.find((m) => m.month === month)?.total_expense ?? 0;
  const prior = summary.filter((m) => m.month < month && m.total_expense > 0);
  const mean = (values: number[]) =>
    values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : null;

  const average = mean(prior.map((m) => m.total_expense));
  const inProgress = month === today.slice(0, 7);
  const expected = inProgress
    ? mean(prior.map((m) => m.expense_to_day ?? 0))
    : average;
  const pct =
    expected && expected > 0
      ? Math.round(((expense - expected) / expected) * 100)
      : null;

  return {
    expense,
    average,
    expected,
    pct,
    inProgress,
    monthsCompared: prior.length,
  };
}

export type CategoryDeviation = {
  categoryId: number;
  category: string;
  icon: string | null;
  amount: number;
  average: number;
  delta: number;
};

/**
 * Each category's spending in `month` against its own average over the
 * earlier months in the trend window in which the user spent anything. When
 * the trend carries `values_to_day`, earlier months count only up to that day.
 */
export function categoryDeviations(
  trend: Pick<CategoryTrendResponse, 'months' | 'categories'>,
  month: string,
): CategoryDeviation[] {
  const idx = trend.months.indexOf(month);
  if (idx < 0) return [];
  const activeMonths = trend.months
    .map((_, i) => i)
    .filter(
      (i) =>
        i < idx && trend.categories.some((cat) => (cat.values[i] ?? 0) > 0),
    );
  if (activeMonths.length === 0) return [];

  return trend.categories
    .filter((cat) => cat.category_id != null)
    .map((cat) => {
      const baseline = cat.values_to_day ?? cat.values;
      const amount = cat.values[idx] ?? 0;
      const average =
        activeMonths.reduce((sum, i) => sum + (baseline[i] ?? 0), 0) /
        activeMonths.length;
      return {
        categoryId: cat.category_id!,
        category: cat.category ?? 'Sin categoría',
        icon: cat.category_icon ?? null,
        amount,
        average,
        delta: Math.round(amount - average),
      };
    })
    .filter((d) => d.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
