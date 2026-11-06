import type { Transaction } from '@/types/api';

export type SplitMode = 'equal' | 'other' | 'amount' | 'percent';

export type SplitState = {
  mode: SplitMode;
  /** Used when `mode` is `percent`. */
  percentages: Record<string, number>;
  /** Whole pesos, used when `mode` is `amount`. */
  amounts: Record<string, number>;
};

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

export function equalPercentages(members: Member[]): Record<string, number> {
  const parts = allocate(
    100,
    members.map(() => 1),
  );
  return Object.fromEntries(members.map((m, i) => [m.user_id, parts[i]!]));
}

export const equalSplit = (members: Member[]): SplitState => ({
  mode: 'equal',
  percentages: equalPercentages(members),
  amounts: {},
});

/** The member who isn't the viewer, when "Todo para…" applies (two members). */
export const otherMember = <M extends Member>(members: M[], userId?: string) =>
  members.length === 2 ? members.find((m) => m.user_id !== userId) : undefined;

/** Recovers the split of a movement being edited or repeated. */
export function initialSplitState(
  transaction: Pick<Transaction, 'splits' | 'user_id'> | null | undefined,
  members: Member[],
  userId?: string,
): SplitState {
  const splits = transaction?.splits ?? [];
  if (splits.length === 0) return equalSplit(members);
  const amounts = Object.fromEntries(
    splits.map((s) => [s.user_id, Math.round(s.amount ?? 0)]),
  );
  const values = Object.values(amounts);
  const other = otherMember(members, userId);
  if (
    other &&
    amounts[other.user_id]! > 0 &&
    values.filter((v) => v > 0).length === 1
  ) {
    return { mode: 'other', percentages: {}, amounts };
  }
  if (
    splits.length === members.length &&
    Math.max(...values) - Math.min(...values) <= 1
  ) {
    return equalSplit(members);
  }
  return { mode: 'amount', percentages: {}, amounts };
}

/** Each member's pesos under the current split, for display. */
export function splitAmounts(
  state: SplitState,
  members: Member[],
  total: number,
  userId?: string,
): Record<string, number> {
  if (state.mode === 'amount') return state.amounts;
  const weights =
    state.mode === 'other'
      ? members.map((m) =>
          m.user_id === otherMember(members, userId)?.user_id ? 1 : 0,
        )
      : members.map((m) =>
          state.mode === 'equal' ? 1 : (state.percentages[m.user_id] ?? 0),
        );
  const parts = allocate(total, weights);
  return Object.fromEntries(members.map((m, i) => [m.user_id, parts[i]!]));
}

export type SplitPayload = {
  user_id: string;
  percentage?: number;
  amount?: number;
};

/** Parts to send to the API, or what is wrong with them. */
export function splitPayload(
  state: SplitState,
  members: Member[],
  total: number,
  userId?: string,
): { splits: SplitPayload[] } | { error: string } {
  if (state.mode === 'percent') {
    const sum = members.reduce(
      (s, m) => s + (state.percentages[m.user_id] ?? 0),
      0,
    );
    if (sum !== 100)
      return { error: `La división debe sumar 100% (ahora suma ${sum}%).` };
    return {
      splits: members.map((m) => ({
        user_id: m.user_id,
        percentage: state.percentages[m.user_id] ?? 0,
      })),
    };
  }
  if (state.mode === 'amount') {
    const sum = members.reduce(
      (s, m) => s + (state.amounts[m.user_id] ?? 0),
      0,
    );
    if (sum !== Math.round(total)) {
      const diff = Math.round(total) - sum;
      const pesos = Math.abs(diff).toLocaleString('es-CL');
      return {
        error:
          diff > 0
            ? `Las partes suman menos que el monto: faltan $${pesos}.`
            : `Las partes suman más que el monto: sobran $${pesos}.`,
      };
    }
  }
  const amounts = splitAmounts(state, members, total, userId);
  return {
    splits: members.map((m) => ({
      user_id: m.user_id,
      amount: amounts[m.user_id] ?? 0,
    })),
  };
}
