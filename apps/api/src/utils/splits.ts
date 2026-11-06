export type SplitInput = {
  user_id: string;
  percentage?: number;
  amount?: number;
};

const PERCENT_TOLERANCE = 0.5;

/**
 * Splits `total` (whole pesos) in proportion to `weights`, so the parts are
 * whole pesos that add up exactly to `total`. Leftover pesos go to the largest
 * fractional parts, and ties to the earliest weight.
 */
export function allocate(total: number, weights: number[]): number[] {
  const whole = Math.round(total);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (whole * w) / sum);
  const parts = raw.map(Math.floor);
  let left = whole - parts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    parts[i]!++;
    left--;
  }
  return parts;
}

/**
 * Validates the parts of a shared movement of `total` pesos. Parts are either
 * all amounts (whole pesos adding up to the total) or all percentages (adding
 * up to 100). Returns the weights to spread every installment with.
 */
export function splitWeights(
  total: number,
  splits: SplitInput[],
): { weights: number[] } | { error: string } {
  if (new Set(splits.map((s) => s.user_id)).size !== splits.length) {
    return { error: 'Each member can appear only once in the split' };
  }
  if (splits.every((s) => s.amount !== undefined)) {
    const amounts = splits.map((s) => s.amount!);
    if (amounts.some((a) => a < 0 || !Number.isInteger(a))) {
      return { error: 'Split amounts must be whole, non-negative pesos' };
    }
    if (amounts.reduce((a, b) => a + b, 0) !== Math.round(total)) {
      return { error: 'Split amounts must add up to the movement amount' };
    }
    return { weights: amounts };
  }
  if (splits.every((s) => s.percentage !== undefined)) {
    const percentages = splits.map((s) => s.percentage!);
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (
      percentages.some((p) => p < 0) ||
      Math.abs(sum - 100) > PERCENT_TOLERANCE
    ) {
      return { error: 'Split percentages must add up to 100' };
    }
    return { weights: percentages };
  }
  return {
    error: 'Send every part as an amount or every part as a percentage',
  };
}

/** Rows for transaction_splits: exact amounts and integer percentages adding up to 100. */
export function splitRows(
  amount: number,
  userIds: string[],
  weights: number[],
) {
  const amounts = allocate(amount, weights);
  const percentages = allocate(100, weights);
  return userIds.map((user_id, i) => ({
    user_id,
    amount: amounts[i]!,
    percentage: percentages[i]!,
  }));
}
