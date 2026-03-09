'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Tag as TagIcon } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const categories = data?.categories || [];
  const expenses = categories.filter(c => c.type === 'expense');
  const incomes = categories.filter(c => c.type === 'income');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({ name: name.trim(), type }, {
      onSuccess: () => setName('')
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <TagIcon className="text-emerald-500" size={24} />
        <h3 className="text-xl font-bold text-white">Categories</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8 items-center bg-black p-2 rounded-2xl border border-zinc-800">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'expense' | 'income')}
          className="bg-zinc-900 border-none rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-zinc-700 text-sm font-medium"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Category Name..."
          className="flex-1 bg-transparent border-none text-white px-2 py-2 focus:outline-none focus:ring-0 text-sm placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white p-2 rounded-xl transition-colors flex items-center justify-center"
        >
          {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-6 text-zinc-500"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Expenses</h4>
              <div className="space-y-2">
                 {expenses.map(cat => (
                   <div key={cat.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 group">
                      <span className="text-zinc-300 font-medium text-sm">{cat.name}</span>
                      <button 
                        onClick={() => setCategoryToDelete(cat.id)}
                        disabled={deleteMutation.isPending}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-semibold p-1"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
                 {expenses.length === 0 && <p className="text-sm text-zinc-600 italic">No expense categories yet.</p>}
              </div>
           </div>
           
           <div>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Incomes</h4>
              <div className="space-y-2">
                 {incomes.map(cat => (
                   <div key={cat.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 group">
                      <span className="text-zinc-300 font-medium text-sm">{cat.name}</span>
                      <button 
                        onClick={() => setCategoryToDelete(cat.id)}
                        disabled={deleteMutation.isPending}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-semibold p-1"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
                 {incomes.length === 0 && <p className="text-sm text-zinc-600 italic">No income categories yet.</p>}
              </div>
           </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete !== null) deleteMutation.mutate(categoryToDelete);
        }}
        title="Delete Category"
        message="¿Estás seguro? Borrar esta categoría eliminará permanentemente todas las transacciones y reglas automáticas asociadas."
      />
    </div>
  );
}
