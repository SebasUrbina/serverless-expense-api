import { create } from 'zustand';
import { useMutationState } from '@tanstack/react-query';
import {
  DELETE_TRANSACTION_KEY,
  type DeletedTransaction,
} from '@/lib/offlineMutations';

type PendingDeletesState = {
  items: DeletedTransaction[];
  add: (item: DeletedTransaction) => void;
  remove: (id: number) => void;
};

/**
 * Movements the user deleted but can still undo. They are hidden from lists
 * right away and deleted on the server when the undo window ends.
 */
export const usePendingDeletes = create<PendingDeletesState>((set) => ({
  items: [],
  add: (item) =>
    set((state) => ({
      items: [...state.items.filter((i) => i.id !== item.id), item],
    })),
  remove: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
}));

/**
 * Every movement being deleted: still undoable, or already confirmed and
 * waiting for the server (offline or in flight).
 */
export function useDeletedTransactions(): DeletedTransaction[] {
  const undoable = usePendingDeletes((s) => s.items);
  const sending = useMutationState({
    filters: { mutationKey: DELETE_TRANSACTION_KEY, status: 'pending' },
    select: (m) => m.state.variables as DeletedTransaction | undefined,
  });
  const byId = new Map<number, DeletedTransaction>();
  for (const item of [...undoable, ...sending]) {
    if (item) byId.set(item.id, item);
  }
  return [...byId.values()];
}

/** Ids hidden from lists while their deletion is pending. */
export function usePendingDeleteIds() {
  return new Set(useDeletedTransactions().map((t) => t.id));
}

/**
 * How much the server totals of `month` still include from movements being
 * deleted, so summaries can subtract them until the server catches up.
 */
export function useDeletedTotals(month: string) {
  const inMonth = useDeletedTransactions().filter((t) =>
    t.date.startsWith(month),
  );
  const byCategory = new Map<number, number>();
  let expense = 0;
  let income = 0;
  for (const t of inMonth) {
    if (t.type === 'expense') {
      expense += t.amount;
      if (t.category_id != null) {
        byCategory.set(
          t.category_id,
          (byCategory.get(t.category_id) ?? 0) + t.amount,
        );
      }
    } else {
      income += t.amount;
    }
  }
  return { expense, income, count: inMonth.length, byCategory };
}
