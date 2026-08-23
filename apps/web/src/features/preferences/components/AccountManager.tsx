'use client';

import { useState } from 'react';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '@/features/preferences/hooks';
import {
  Plus,
  Trash2,
  Banknote,
  CreditCard,
  PiggyBank,
  Wallet,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import type { Account } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const accountTypeConfig: Record<
  Account['type'],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  checking: {
    label: 'Cuenta corriente',
    icon: Banknote,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  savings: {
    label: 'Ahorros',
    icon: PiggyBank,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  credit: {
    label: 'Tarjeta de crédito',
    icon: CreditCard,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  cash: {
    label: 'Efectivo',
    icon: Wallet,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
};

export function AccountManager() {
  const { data, isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const deleteMutation = useDeleteAccount();
  const updateMutation = useUpdateAccount();

  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [balance, setBalance] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Account['type']>('checking');
  const [editBalance, setEditBalance] = useState('');

  const accounts = data?.accounts || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      {
        name: name.trim(),
        type,
        balance: balance ? parseFloat(balance) : 0,
      },
      {
        onSuccess: () => {
          setName('');
          setBalance('');
        },
      },
    );
  };

  const beginEditing = (account: Account) => {
    setEditingAccountId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setEditBalance(account.balance ? String(account.balance) : '0');
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditName('');
    setEditType('checking');
    setEditBalance('');
  };

  const saveAccount = (accountId: number) => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    updateMutation.mutate(
      {
        id: accountId,
        name: trimmedName,
        type: editType,
        balance: editBalance === '' ? 0 : Number(editBalance),
      },
      {
        onSuccess: () => {
          cancelEditing();
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border-border-subtle space-y-3 rounded-2xl border p-3 sm:p-4"
      >
        {/* Row 1: Type */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="shrink-0 sm:w-[160px]">
            <label className="text-muted mb-1 block px-0.5 text-[10px] font-semibold tracking-wider uppercase">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-xl border px-3 py-2.5 text-sm font-medium focus:ring-2 focus:outline-none"
            >
              <option value="checking">Cta. corriente</option>
              <option value="savings">Ahorros</option>
              <option value="credit">Tarjeta crédito</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
          <div className="hidden flex-1 sm:block" />
        </div>

        {/* Row 2: Name */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="min-w-0 flex-1">
            <label className="text-muted mb-1 block px-0.5 text-[10px] font-semibold tracking-wider uppercase">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Banco Estado"
              className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Balance + Button */}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-muted mb-1 block px-0.5 text-[10px] font-semibold tracking-wider uppercase">
              Saldo inicial
            </label>
            <div className="relative">
              <span className="text-muted absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold">
                $
              </span>
              <input
                type="number"
                value={balance}
                step="1"
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-xl border py-2.5 pr-3 pl-7 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="bg-accent flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <Plus size={15} />
                <span>Agregar cuenta</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Accounts list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner color="muted" />
        </div>
      ) : accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((acc) => {
            const cfg =
              accountTypeConfig[acc.type] || accountTypeConfig.checking;
            const Icon = cfg.icon;
            return (
              <div
                key={acc.id}
                className={`bg-card rounded-xl border px-3 py-2.5 transition-colors ${
                  editingAccountId === acc.id
                    ? 'border-border'
                    : 'border-border-subtle'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
                  >
                    <Icon size={15} className={cfg.color} />
                  </div>

                  {/* Name + type stacked */}
                  <div className="min-w-0 flex-1">
                    <p className="text-primary truncate text-sm leading-tight font-medium">
                      {acc.name}
                    </p>
                    <p className="text-muted mt-0.5 truncate text-[10px] leading-tight">
                      {cfg.label}
                    </p>
                  </div>

                  {/* Balance */}
                  <p
                    className={`shrink-0 text-sm font-bold ${acc.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                  >
                    ${formatCurrency(acc.balance)}
                  </p>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => beginEditing(acc)}
                      disabled={
                        updateMutation.isPending || deleteMutation.isPending
                      }
                      className="bg-inset border-border text-primary hover:bg-card-hover inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                      aria-label={`Editar cuenta ${acc.name}`}
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountToDelete(acc.id)}
                      disabled={
                        deleteMutation.isPending || updateMutation.isPending
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                      aria-label={`Eliminar cuenta ${acc.name}`}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {editingAccountId === acc.id && (
                  <div className="bg-inset border-border-subtle mt-2.5 space-y-2.5 rounded-xl border p-2.5">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveAccount(acc.id);
                          }
                          if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      />
                      <div className="relative">
                        <span className="text-muted absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          step="1"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="focus:ring-accent/30 bg-card border-border text-primary w-28 rounded-lg border py-2 pr-3 pl-7 text-sm focus:ring-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={editType}
                        onChange={(e) =>
                          setEditType(e.target.value as Account['type'])
                        }
                        className="focus:ring-accent/30 bg-card border-border text-primary min-w-0 rounded-lg border px-3 py-2 text-sm font-medium focus:ring-2 focus:outline-none"
                      >
                        <option value="checking">Cuenta corriente</option>
                        <option value="savings">Ahorros</option>
                        <option value="credit">Tarjeta crédito</option>
                        <option value="cash">Efectivo</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveAccount(acc.id)}
                          disabled={
                            !editName.trim() || updateMutation.isPending
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                          aria-label="Guardar cambios"
                          title="Guardar"
                        >
                          {updateMutation.isPending ? (
                            <LoadingSpinner size="sm" color="white" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-card border-border text-secondary hover:text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                          aria-label="Cancelar edición"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted py-4 text-center text-sm">
          Aún no tienes cuentas. Agrega una para empezar a registrar tus
          movimientos.
        </p>
      )}

      <ConfirmDeleteModal
        isOpen={accountToDelete !== null}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete !== null) deleteMutation.mutate(accountToDelete);
        }}
        title="Eliminar cuenta"
        message="¿Estás seguro? Borrar esta cuenta eliminará permanentemente TODAS las transacciones y reglas asociadas. Esta acción no se puede deshacer."
      />
    </div>
  );
}
