'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DELETE_TRANSACTION_KEY,
  runTransactionMutation,
  type DeletedTransaction,
} from '@/lib/offlineMutations';
import { usePendingDeletes } from '@/store/usePendingDeletes';

const UNDO_MS = 5000;

/**
 * Deletes pending movements when their undo window ends (or right away when
 * the app goes to the background) and offers "Deshacer" meanwhile.
 */
export function UndoDeleteToast() {
  const { items, remove } = usePendingDeletes();
  const queryClient = useQueryClient();
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const [failed, setFailed] = useState<string | null>(null);

  // Offline, the deletion pauses and is sent on reconnect; lists keep it hidden.
  const commit = useCallback(
    async (item: DeletedTransaction) => {
      clearTimeout(timers.current.get(item.id));
      timers.current.delete(item.id);
      remove(item.id);
      try {
        await runTransactionMutation(queryClient, DELETE_TRANSACTION_KEY, item);
      } catch {
        setFailed(item.title);
      }
    },
    [queryClient, remove],
  );

  useEffect(() => {
    const live = new Set(items.map((i) => i.id));
    for (const [id, timer] of timers.current) {
      if (!live.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    }
    for (const item of items) {
      if (!timers.current.has(item.id)) {
        timers.current.set(
          item.id,
          setTimeout(() => void commit(item), UNDO_MS),
        );
      }
    }
  }, [items, commit]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden') return;
      for (const item of usePendingDeletes.getState().items) {
        void commit(item);
      }
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [commit]);

  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => setFailed(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [failed]);

  const latest = items.at(-1);
  if (!latest && !failed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[90] flex justify-center px-4 lg:bottom-6">
      <div
        role="status"
        aria-live="polite"
        className="bg-primary text-card shadow-elevated pointer-events-auto flex max-w-sm min-w-0 items-center gap-3 rounded-2xl py-2 pr-2 pl-4 text-sm"
      >
        <span className="min-w-0 flex-1 truncate">
          {latest
            ? items.length > 1
              ? `${items.length} movimientos eliminados`
              : `«${latest.title}» eliminado`
            : `No pudimos eliminar «${failed}». Volvió a la lista.`}
        </span>
        {latest && (
          <button
            type="button"
            onClick={() => items.forEach((i) => remove(i.id))}
            className="focus-ring bg-card/15 hover:bg-card/25 text-card min-h-10 shrink-0 rounded-xl px-3 font-bold transition-colors"
          >
            Deshacer
          </button>
        )}
      </div>
    </div>
  );
}
