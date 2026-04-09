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
        className="rounded-2xl p-3.5 flex flex-wrap gap-2 items-end"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        {/* Type selector */}
        <div className="flex-1 min-w-[130px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
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
            <option value="checking">Cuenta corriente</option>
            <option value="savings">Ahorros</option>
            <option value="credit">Tarjeta de crédito</option>
            <option value="cash">Efectivo</option>
          </select>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
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

        {/* Balance */}
        <div className="flex-1 min-w-[110px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
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
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-end"
        >
          {createMutation.isPending
            ? <Loader2 size={15} className="animate-spin" />
            : <><Plus size={15} /><span>Añadir</span></>
          }
        </button>
      </form>

      {/* Accounts grid */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map(acc => {
            const cfg = accountTypeConfig[acc.type] || accountTypeConfig.checking;
            const Icon = cfg.icon;
            return (
              <div
                key={acc.id}
                className="group relative rounded-2xl p-4 flex items-center gap-3 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {acc.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cfg.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${acc.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatCurrency(acc.balance)}
                  </p>
                </div>
                <button
                  onClick={() => setAccountToDelete(acc.id)}
                  disabled={deleteMutation.isPending}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          Sin cuentas aún. Añade una para empezar a registrar tus movimientos.
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
