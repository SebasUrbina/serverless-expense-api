'use client';

import { useState } from 'react';
import { X, ArrowRight, CheckCircle2, Loader2, Wallet } from 'lucide-react';
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
      maxWidth="max-w-md"
      zIndex="z-[150]"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Saldar deudas
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {groupName} · {month}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mt-2 -mr-2 rounded-full p-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Settlement pairs selection */}
        <div className="mb-5">
          <p
            className="mb-3 text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Deudas a saldar
          </p>
          <div className="space-y-2">
            {pairs.map((pair, i) => (
              <button
                key={i}
                onClick={() => togglePair(i)}
                className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
                style={{
                  background: selectedPairs.has(i)
                    ? 'rgba(16,185,129,0.06)'
                    : 'var(--bg-inset)',
                  borderColor: selectedPairs.has(i)
                    ? 'rgba(16,185,129,0.3)'
                    : 'var(--border-subtle)',
                }}
              >
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                  style={{
                    borderColor: selectedPairs.has(i)
                      ? '#10b981'
                      : 'var(--border)',
                    background: selectedPairs.has(i)
                      ? '#10b981'
                      : 'transparent',
                  }}
                >
                  {selectedPairs.has(i) && (
                    <CheckCircle2 size={12} className="text-white" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {pair.debtor}
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-emerald-500" />
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {pair.creditor}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-bold text-emerald-500">
                  ${formatCurrency(pair.amount)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Account selector */}
        <div className="mb-6">
          <p
            className="mb-3 text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Cuenta para registrar
          </p>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all"
                style={{
                  background:
                    selectedAccountId === acc.id
                      ? 'rgba(16,185,129,0.06)'
                      : 'var(--bg-inset)',
                  borderColor:
                    selectedAccountId === acc.id
                      ? 'rgba(16,185,129,0.3)'
                      : 'var(--border-subtle)',
                }}
              >
                <Wallet
                  size={14}
                  className={
                    selectedAccountId === acc.id ? 'text-emerald-500' : ''
                  }
                  style={
                    selectedAccountId !== acc.id
                      ? { color: 'var(--text-muted)' }
                      : {}
                  }
                />
                <span
                  className="truncate text-sm font-medium"
                  style={{
                    color:
                      selectedAccountId === acc.id
                        ? '#10b981'
                        : 'var(--text-secondary)',
                  }}
                >
                  {acc.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary + Actions */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Total a saldar
            </span>
            <span className="text-xl font-bold text-emerald-500">
              ${formatCurrency(totalToSettle)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              style={{
                background: 'var(--bg-inset)',
                color: 'var(--text-primary)',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isPending || selectedPairs.size === 0 || !selectedAccountId
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/50"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Confirmar
            </button>
          </div>
          <p
            className="mt-3 text-center text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Se registrará un gasto al deudor y un ingreso al acreedor por cada
            deuda saldada.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
