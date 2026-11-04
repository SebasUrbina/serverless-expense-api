import type { Transaction } from '@/types/api';

/** Title prefix of the debtor's movement created by the removed `POST /groups/:id/settle`. */
const SETTLEMENT_PREFIX = '💸 Saldo';

export const isSettlement = (tx: Pick<Transaction, 'title'>) =>
  tx.title.startsWith(SETTLEMENT_PREFIX);

export type LedgerEffect =
  | { kind: 'lent'; amount: number }
  | { kind: 'owe'; amount: number }
  | { kind: 'paid'; amount: number }
  | { kind: 'received'; amount: number }
  | { kind: 'none' };

/** How a shared movement changes what the viewer owes or is owed. */
export function ledgerEffect(
  tx: Pick<Transaction, 'title' | 'amount' | 'user_id' | 'my_split_amount'>,
  userId: string | undefined,
): LedgerEffect {
  const mine = tx.my_split_amount ?? 0;
  const paidByMe = !!userId && tx.user_id === userId;

  if (isSettlement(tx)) {
    if (paidByMe) return { kind: 'paid', amount: tx.amount };
    return mine > 0 ? { kind: 'received', amount: mine } : { kind: 'none' };
  }
  if (paidByMe) {
    const lent = tx.amount - mine;
    return lent > 0 ? { kind: 'lent', amount: lent } : { kind: 'none' };
  }
  return mine > 0 ? { kind: 'owe', amount: mine } : { kind: 'none' };
}

/** Stable palette slot (1–8, see `--cat-*`) for a member across every group. */
export function memberColorSlot(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return (hash % 8) + 1;
}
