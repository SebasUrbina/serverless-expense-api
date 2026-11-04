'use client';

import { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { CloudOff } from 'lucide-react';
import {
  CREATE_TRANSACTION_KEY,
  type CreateTransactionVariables,
} from '@/lib/offlineMutations';
import { formatCurrency } from '@/lib/utils';

const subscribe = (callback: () => void) => onlineManager.subscribe(callback);

/** Shows when the app is offline and which new movements are waiting to sync. */
export function SyncStatusBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const queued = useMutationState({
    filters: {
      mutationKey: CREATE_TRANSACTION_KEY,
      predicate: (mutation) => mutation.state.isPaused,
    },
    select: (mutation) =>
      mutation.state.variables as CreateTransactionVariables | undefined,
  }).filter((v): v is CreateTransactionVariables => !!v);

  if (online && queued.length === 0) return null;

  const names = queued
    .map(
      (tx) =>
        `${tx.title} (${tx.type === 'income' ? '+' : '−'}$${formatCurrency(tx.amount)})`,
    )
    .join(', ');

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-inset border-border mx-4 mt-3 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm sm:mx-6"
    >
      <CloudOff
        size={16}
        aria-hidden="true"
        className="text-secondary mt-0.5 shrink-0"
      />
      <p className="text-secondary min-w-0">
        <b className="text-primary font-semibold">
          {queued.length > 0
            ? `${queued.length} ${queued.length === 1 ? 'movimiento' : 'movimientos'} sin sincronizar.`
            : 'Sin conexión.'}
        </b>{' '}
        {queued.length > 0
          ? `Se enviarán al recuperar la conexión: ${names}.`
          : 'Puedes seguir registrando movimientos; se enviarán al reconectar.'}
      </p>
    </div>
  );
}
