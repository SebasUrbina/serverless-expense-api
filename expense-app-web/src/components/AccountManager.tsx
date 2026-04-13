'use client';

import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Banknote, CreditCard, PiggyBank, Wallet, Pencil, Check, X } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { Account } from '@/types/api';

const accountTypeConfig: Record<Account['type'], { label: string; icon: React.ElementType; color: string; bg: string }> = {
  checking: { label: 'Cuenta corriente', icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  savings: { label: 'Ahorros', icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  credit: { label: 'Tarjeta de crédito', icon: CreditCard, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  cash: { label: 'Efectivo', icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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
    createMutation.mutate({
      name: name.trim(),
      type,
      balance: balance ? parseFloat(balance) : 0
    }, {
      onSuccess: () => {
        setName('');
        setBalance('');
      }
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

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
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl p-3 sm:p-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Row 1: Type */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="shrink-0 sm:w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block px-0.5" style={{ color: 'var(--text-muted)' }}>
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="checking">Cta. corriente</option>
              <option value="savings">Ahorros</option>
              <option value="credit">Tarjeta crédito</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
          <div className="hidden sm:block flex-1" />
        </div>

        {/* Row 2: Name */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block px-0.5" style={{ color: 'var(--text-muted)' }}>
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Banco Estado"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Row 2: Balance + Button */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block px-0.5" style={{ color: 'var(--text-muted)' }}>
              Saldo inicial
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>$</span>
              <input
                type="number"
                value={balance}
                step="1"
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white h-11 px-5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {createMutation.isPending
              ? <Loader2 size={15} className="animate-spin" />
              : <><Plus size={15} /><span>Agregar cuenta</span></>
            }
          </button>
        </div>
      </form>

      {/* Accounts list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map(acc => {
            const cfg = accountTypeConfig[acc.type] || accountTypeConfig.checking;
            const Icon = cfg.icon;
            return (
              <div
                key={acc.id}
                className="rounded-xl px-3 py-2.5 transition-colors"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${editingAccountId === acc.id ? 'var(--border)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>

                  {/* Name + type stacked — takes all available horizontal space */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {acc.name}
                    </p>
                    <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {cfg.label}
                    </p>
                  </div>

                  {/* Balance — hidden label on small screens, always show number */}
                  <p className={`font-bold text-sm shrink-0 ${acc.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatCurrency(acc.balance)}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => beginEditing(acc)}
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      aria-label={`Editar cuenta ${acc.name}`}
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountToDelete(acc.id)}
                      disabled={deleteMutation.isPending || updateMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors text-red-500"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.16)' }}
                      aria-label={`Eliminar cuenta ${acc.name}`}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {editingAccountId === acc.id && (
                  <div className="mt-2.5 space-y-2.5 rounded-xl p-2.5" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
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
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>$</span>
                        <input
                          type="number"
                          step="1"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="w-28 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as Account['type'])}
                        className="min-w-0 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
                          disabled={!editName.trim() || updateMutation.isPending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-50"
                          style={{ background: '#10b981' }}
                          aria-label="Guardar cambios"
                          title="Guardar"
                        >
                          {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          Aún no tienes cuentas. Agrega una para empezar a registrar tus movimientos.
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
