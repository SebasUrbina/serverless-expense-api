'use client';

import { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { CloudOff } from 'lucide-react';
import {
  CREATE_TRANSACTION_KEY,
  DELETE_TRANSACTION_KEY,
  UPDATE_TRANSACTION_KEY,
  type CreateTransactionVariables,
  type DeletedTransaction,
  type UpdateTransactionVariables,
} from '@/lib/offlineMutations';
import { formatCurrency } from '@/lib/utils';

const subscribe = (callback: () => void) => onlineManager.subscribe(callback);

/** Shows when the app is offline and which changes are waiting to sync. */
export function SyncStatusBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const queued = useMutationState({
    filters: {
      predicate: (mutation) =>
        mutation.state.isPaused &&
        mutation.options.scope?.id === 'transactions',
    },
    select: (mutation) => {
      const key = mutation.options.mutationKey?.[1];
      if (key === CREATE_TRANSACTION_KEY[1]) {
        const tx = mutation.state.variables as CreateTransactionVariables;
        return `${tx.title} (${tx.type === 'income' ? '+' : '−'}$${formatCurrency(tx.amount)})`;
      }
      if (key === UPDATE_TRANSACTION_KEY[1]) {
        const { payload } = mutation.state
          .variables as UpdateTransactionVariables;
        return `${payload.title} (editado)`;
      }
      if (key === DELETE_TRANSACTION_KEY[1]) {
        const tx = mutation.state.variables as DeletedTransaction;
        return `${tx.title} (eliminado)`;
      }
      return null;
    },
  }).filter((label): label is string => !!label);

  if (online && queued.length === 0) return null;

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
            ? `${queued.length} ${queued.length === 1 ? 'cambio' : 'cambios'} sin sincronizar.`
            : 'Sin conexión.'}
        </b>{' '}
        {queued.length > 0
          ? `Se enviarán al recuperar la conexión: ${queued.join(', ')}.`
          : 'Puedes seguir registrando, editando y borrando; se enviará al reconectar.'}
      </p>
    </div>
  );
}
