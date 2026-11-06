import type { Transaction } from '@/types/api';

/** Percent of the movement each member covers, by user id. */
export type SplitPercentages = Record<string, number>;

type Member = { user_id: string };

/** Whole pesos in proportion to `weights` that add up exactly to `total` (as the API does). */
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

/** Whole percentages adding up to 100, as equal as possible (34/33/33). */
export function equalPercentages(members: Member[]): SplitPercentages {
  const parts = allocate(
    100,
    members.map(() => 1),
  );
  return Object.fromEntries(members.map((m, i) => [m.user_id, parts[i]!]));
}

const isEqualSplit = (percentages: SplitPercentages, members: Member[]) => {
  const equal = equalPercentages(members);
  return members.every((m) => percentages[m.user_id] === equal[m.user_id]);
};

/** The split of a movement being edited or repeated, or equal parts. */
export function initialPercentages(
  transaction: Pick<Transaction, 'splits'> | null | undefined,
  members: Member[],
): SplitPercentages {
  const splits = transaction?.splits ?? [];
  if (splits.length === 0) return equalPercentages(members);
  return Object.fromEntries(splits.map((s) => [s.user_id, s.percentage]));
}

/**
 * Weights the parts are spread with. Equal parts are sent as equal weights,
 * so three people split $20.000 as 6.667/6.667/6.666, not by 34/33/33 %.
 */
function weights(percentages: SplitPercentages, members: Member[]) {
  return isEqualSplit(percentages, members)
    ? members.map(() => 100 / members.length)
    : members.map((m) => percentages[m.user_id] ?? 0);
}

/** Each member's pesos under the split, exactly as the API will store them. */
export function splitAmounts(
  percentages: SplitPercentages,
  members: Member[],
  total: number,
): Record<string, number> {
  const parts = allocate(total, weights(percentages, members));
  return Object.fromEntries(members.map((m, i) => [m.user_id, parts[i]!]));
}

export type SplitPayload = { user_id: string; percentage: number };

/** Parts to send to the API, or what is wrong with them. */
export function splitPayload(
  percentages: SplitPercentages,
  members: Member[],
): { splits: SplitPayload[] } | { error: string } {
  const sum = members.reduce((s, m) => s + (percentages[m.user_id] ?? 0), 0);
  if (sum !== 100)
    return { error: `La división debe sumar 100% (ahora suma ${sum}%).` };
  const w = weights(percentages, members);
  return {
    splits: members.map((m, i) => ({ user_id: m.user_id, percentage: w[i]! })),
  };
}
