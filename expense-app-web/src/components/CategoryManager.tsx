'use client';

import { useState, useRef, useEffect } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Tag as TagIcon, SmilePlus } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('💰');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = data?.categories || [];
  const expenses = categories.filter(c => c.type === 'expense');
  const incomes = categories.filter(c => c.type === 'income');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({ name: name.trim(), type, icon }, {
      onSuccess: () => {
        setName('');
        setIcon('💰'); // reset to default
      }
    });
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setIcon(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-4xl p-5 md:p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <TagIcon className="text-emerald-500" size={24} />
        <h3 className="text-xl font-bold text-white tracking-tight">Categories</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 mb-8 items-center bg-black p-4 rounded-2xl border border-zinc-800">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'expense' | 'income')}
          className="w-full md:w-auto bg-zinc-900 border-none rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-zinc-700 text-sm font-medium"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        
        <div className="flex w-full flex-1 relative items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2.5 text-xl flex items-center justify-center transition-colors shadow-sm"
            >
              {icon}
            </button>
            {showEmojiPicker && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" 
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div 
                  ref={emojiPickerRef} 
                  className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center bg-zinc-950 border-t border-zinc-800 rounded-t-3xl pt-2 pb-8 shadow-2xl animate-in slide-in-from-bottom-full md:absolute md:inset-auto md:top-14 md:left-0 md:bg-transparent md:border-none md:p-0 md:rounded-xl md:animate-none"
                >
                  <div className="w-12 h-1.5 bg-zinc-800 rounded-full mb-4 md:hidden" />
                  <div className="w-full max-w-sm px-4 md:px-0">
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme={Theme.DARK}
                      width="100%"
                      height={400}
                    />
                  </div>
                </div>
              </>
            )}
            
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Category Name..."
              className="w-full flex-1 bg-zinc-900 md:bg-transparent rounded-xl md:rounded-none border-none text-white px-4 md:px-2 py-2.5 focus:outline-none focus:ring-1 md:focus:ring-0 focus:ring-zinc-700 text-sm placeholder:text-zinc-600 shadow-sm md:shadow-none"
            />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
        >
          {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> <span>Add</span></>}
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
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{cat.icon || '🏷️'}</span>
                        <span className="text-zinc-300 font-medium text-sm">{cat.name}</span>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{cat.icon || '🏷️'}</span>
                        <span className="text-zinc-300 font-medium text-sm">{cat.name}</span>
                      </div>
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
