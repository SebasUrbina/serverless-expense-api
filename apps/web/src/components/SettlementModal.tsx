'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCreateSettlement } from '@/hooks/useGroupBalances';
import { BaseModal } from './ui/BaseModal';
import { formatAmountInput, parseAmountInput } from './TransactionFields';
import type { SettlementPair } from '@/types/api';

/** Records that one of the viewer's debts in a group was paid, in full or in part. */
export function SettlementModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  pairs,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  /** Pairs where the viewer pays or receives. */
  pairs: SettlementPair[];
  userId?: string;
}) {
  const [selected, setSelected] = useState(0);
  const pair = pairs[selected] ?? pairs[0];
  const [amount, setAmount] = useState(
    pair ? formatAmountInput(String(pair.amount)) : '',
  );
  const createMutation = useCreateSettlement(onClose);
  const value = parseAmountInput(amount);

  if (!pair) return null;

  const choose = (index: number) => {
    setSelected(index);
    setAmount(formatAmountInput(String(pairs[index]!.amount)));
  };

  const confirm = () => {
    if (value <= 0 || createMutation.isPending) return;
    createMutation.mutate({
      groupId,
      from_user_id: pair.from_user_id,
      to_user_id: pair.to_user_id,
      amount: value,
    });
  };

  const describe = (p: SettlementPair) =>
    p.to_user_id === userId
      ? `${p.from_nickname} te pagó`
      : `Le pagaste a ${p.to_nickname}`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      label="Registrar pago"
      maxWidth="max-w-md"
      zIndex="z-[150]"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-primary text-lg font-bold">Registrar pago</h2>
            <p className="text-secondary mt-0.5 text-[13px]">{groupName}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-muted hover:text-primary hover:bg-inset focus-ring -mt-1 -mr-2 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {pairs.length > 1 && (
          <fieldset className="mt-5">
            <legend className="text-secondary mb-2 text-sm font-semibold">
              ¿Qué pago?
            </legend>
            <div role="radiogroup" className="space-y-2">
              {pairs.map((p, i) => {
                const checked = i === selected;
                return (
                  <button
                    key={`${p.from_user_id}-${p.to_user_id}`}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => choose(i)}
                    className={`focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      checked
                        ? 'border-accent bg-accent-soft'
                        : 'bg-inset border-transparent'
                    }`}
                  >
                    <span className="text-primary min-w-0 flex-1 truncate text-sm font-medium">
                      {describe(p)}
                    </span>
                    <span className="text-secondary shrink-0 text-sm tabular-nums">
                      debe ${formatCurrency(p.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <label htmlFor="settlement-amount" className="mt-5 block">
          <span className="text-secondary mb-2 block text-sm font-semibold">
            {pairs.length > 1 ? 'Monto' : describe(pair)}
          </span>
          <span className="bg-inset border-border flex min-h-12 items-center gap-1 rounded-xl border px-3">
            <span className="text-muted text-lg font-semibold">$</span>
            <input
              id="settlement-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              className="text-primary min-w-0 flex-1 bg-transparent text-lg font-semibold tabular-nums focus:outline-none"
            />
          </span>
        </label>
        <p className="text-muted mt-2 text-xs">
          {value > 0 && value < pair.amount
            ? `Pago parcial: quedan $${formatCurrency(pair.amount - value)} pendientes.`
            : value > pair.amount
              ? `Es más que la deuda; la diferencia queda ${pair.from_user_id === userId ? 'a tu favor' : `a favor de ${pair.from_nickname}`}.`
              : 'Queda saldada la deuda completa.'}
        </p>

        {createMutation.isError && (
          <p role="alert" className="text-expense mt-3 text-sm">
            No pudimos registrar el pago. Intenta nuevamente.
          </p>
        )}

        <div className="border-border mt-6 border-t pt-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-inset text-primary hover:bg-card-hover focus-ring min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={createMutation.isPending || value <= 0}
              className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Registrar
            </button>
          </div>
          <p className="text-muted mt-3 text-center text-xs">
            Es un pago entre ustedes: no suma a tus gastos, ingresos ni
            presupuesto.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
