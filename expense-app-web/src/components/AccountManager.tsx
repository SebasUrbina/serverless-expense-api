'use client';

import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeleteAccount, Account } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Wallet } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-4xl p-5 md:p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="text-blue-500" size={24} />
        <h3 className="text-xl font-bold text-white tracking-tight">Accounts</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8 bg-black p-4 rounded-2xl border border-zinc-800">
        <div className="flex flex-col md:flex-row gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="w-full md:w-auto bg-zinc-900 border-none rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-zinc-700 text-sm font-medium"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit Card</option>
              <option value="cash">Cash</option>
            </select>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Banco Estado"
              className="flex-1 w-full bg-zinc-900 rounded-xl border-none text-white px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm placeholder:text-zinc-500"
            />
            <div className="relative w-full md:w-auto md:min-w-[150px]">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm font-bold">$</span>
                <input
                type="number"
                value={balance}
                step="0.01"
                onChange={(e) => setBalance(e.target.value)}
                placeholder="Initial balance..."
                className="w-full bg-zinc-900 rounded-xl border-none text-white pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-500"
                />
            </div>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="w-full md:w-auto bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center font-medium text-sm"
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} className="mr-1" /> <span>Add</span></>}
            </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-6 text-zinc-500"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => (
                <div key={acc.id} className="flex flex-col bg-zinc-950 p-4 rounded-xl border border-zinc-800 group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className="text-zinc-200 font-bold text-base">{acc.name}</span>
                           <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">{acc.type}</span>
                        </div>
                        <button 
                            onClick={() => setAccountToDelete(acc.id)}
                            disabled={deleteMutation.isPending}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <span className="text-zinc-400 font-medium text-sm">Balance: <span className={acc.balance >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(acc.balance)}</span></span>
                </div>
            ))}
            {accounts.length === 0 && <p className="text-sm text-zinc-600 italic">No accounts setup. Create one to track your budget!</p>}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={accountToDelete !== null}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete !== null) deleteMutation.mutate(accountToDelete);
        }}
        title="Delete Account"
        message="¿Estás seguro? Borrar esta cuenta eliminará permanentemente TODAS las transacciones y reglas asociadas a ella. Esta acción no se puede deshacer."
      />
    </div>
  );
}
