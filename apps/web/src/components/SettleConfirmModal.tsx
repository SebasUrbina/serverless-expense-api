'use client';

import { useState } from 'react';
import { X, ArrowRight, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BaseModal } from './ui/BaseModal';
import type { Account, SettlementPair } from '@/types/api';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: number, selectedPairs: SettlementPair[]) => void;
  groupName: string;
  month: string;
  pairs: SettlementPair[];
  accounts: Account[];
  isPending: boolean;
};

export function SettleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  month,
  pairs,
  accounts,
  isPending,
}: Props) {
  const [selectedAccountId, setSelectedAccountId] = useState<number>(
    accounts[0]?.id ?? 0,
  );
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(
    new Set(pairs.map((_, i) => i)),
  );

  const togglePair = (index: number) => {
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const totalToSettle = pairs
    .filter((_, i) => selectedPairs.has(i))
    .reduce((sum, p) => sum + p.amount, 0);

  const handleConfirm = () => {
    if (selectedPairs.size === 0 || !selectedAccountId) return;
    const chosen = pairs.filter((_, i) => selectedPairs.has(i));
    onConfirm(selectedAccountId, chosen);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      label="Saldar deudas"
      maxWidth="max-w-md"
      zIndex="z-[150]"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-primary text-lg font-bold">Saldar deudas</h2>
            <p className="text-secondary mt-0.5 text-[13px] capitalize">
              {groupName} · {month}
            </p>
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

        <fieldset className="mt-5">
          <legend className="text-secondary mb-2 text-sm font-semibold">
            Deudas a saldar
          </legend>
          <div className="space-y-2">
            {pairs.map((pair, i) => {
              const checked = selectedPairs.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => togglePair(i)}
                  className={`focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    checked
                      ? 'border-accent bg-accent-soft'
                      : 'bg-inset border-transparent'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      checked ? 'border-accent bg-accent' : 'border-border'
                    }`}
                  >
                    {checked && <Check size={12} className="text-on-accent" />}
                  </span>
                  <span className="text-primary flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
                    <span className="truncate">{pair.debtor}</span>
                    <ArrowRight size={12} className="text-muted shrink-0" />
                    <span className="truncate">{pair.creditor}</span>
                  </span>
                  <span className="text-primary shrink-0 text-sm font-semibold tabular-nums">
                    ${formatCurrency(pair.amount)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-secondary mb-2 text-sm font-semibold">
            Cuenta para registrar
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map((acc) => {
              const selected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`focus-ring min-h-11 truncate rounded-xl border px-3 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'bg-inset text-secondary border-transparent'
                  }`}
                >
                  {acc.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="border-border mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-secondary text-sm">Total a saldar</span>
            <span className="text-primary text-xl font-bold tabular-nums">
              ${formatCurrency(totalToSettle)}
            </span>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-inset text-primary hover:bg-card-hover focus-ring min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={
                isPending || selectedPairs.size === 0 || !selectedAccountId
              }
              className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Confirmar
            </button>
          </div>
          <p className="text-muted mt-3 text-center text-xs">
            Se registrará un gasto al deudor y un ingreso al acreedor por cada
            deuda saldada.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
