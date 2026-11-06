import type { Transaction } from '@/types/api';
import { formatCurrency } from './utils';

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

/**
 * Why the API refused to let the viewer leave a group. A 409 carries `net`
 * when they still owe or are owed; otherwise they have upcoming shared movements.
 */
export function leaveGroupError(status?: number, body?: unknown): string {
  if (status !== 409)
    return 'No pudimos sacarte del grupo. Intenta nuevamente.';
  const net = (body as { net?: unknown } | undefined)?.net;
  if (typeof net !== 'number')
    return 'Tienes gastos compartidos con fecha futura en este grupo (por ejemplo, cuotas). Podrás salir cuando ya hayan pasado.';
  const rounded = Math.round(net);
  if (rounded === 0) return 'Para salir, primero tienes que quedar al día.';
  const money = `$${formatCurrency(Math.abs(rounded))}`;
  return `Para salir, primero tienes que quedar al día: ${rounded > 0 ? `te deben ${money}` : `debes ${money}`}.`;
}

/** Stable palette slot (1–8, see `--cat-*`) for a member across every group. */
export function memberColorSlot(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return (hash % 8) + 1;
}
