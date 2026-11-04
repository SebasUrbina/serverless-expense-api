import { create } from 'zustand';

type PendingDelete = { id: number; title: string };

type PendingDeletesState = {
  items: PendingDelete[];
  add: (item: PendingDelete) => void;
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

/** Ids hidden from lists while their deletion can be undone. */
export function usePendingDeleteIds() {
  const items = usePendingDeletes((s) => s.items);
  return new Set(items.map((i) => i.id));
}
