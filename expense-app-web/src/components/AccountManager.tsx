'use client';

import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeleteAccount, Account } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Banknote, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

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

  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [balance, setBalance] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

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
              : <><Plus size={15} /><span>Añadir cuenta</span></>
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
                className="group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                style={{ background: 'var(--bg-card)' }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={17} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {acc.name}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{cfg.label}</p>
                </div>
                <p className={`font-bold text-sm shrink-0 ${acc.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatCurrency(acc.balance)}
                </p>
                <button
                  onClick={() => setAccountToDelete(acc.id)}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          Sin cuentas aún. Añadí una para empezar a registrar tus movimientos.
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
