'use client';

import { useState, useRef, useEffect } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/store/useTheme';

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const { resolvedTheme } = useTheme();

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = data?.categories || [];
  const expenses = categories.filter(c => c.type === 'expense');
  const incomes = categories.filter(c => c.type === 'income');
  const isDark = resolvedTheme() === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), type, icon }, {
      onSuccess: () => {
        setName('');
        setIcon('💰');
      }
    });
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setIcon(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-3.5 flex flex-wrap gap-2 items-center"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        {/* Type toggle */}
        <div
          className="flex rounded-xl p-0.5 gap-0.5 shrink-0"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: type === t ? (t === 'expense' ? '#f43f5e' : '#10b981') : 'transparent',
                color: type === t ? 'white' : 'var(--text-muted)',
              }}
            >
              {t === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>

        {/* Emoji picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {icon}
          </button>
          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-40 md:hidden"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShowEmojiPicker(false)}
              />
              <div
                ref={emojiPickerRef}
                className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center rounded-t-3xl pt-2 pb-8 shadow-2xl animate-in slide-in-from-bottom-full md:absolute md:inset-auto md:top-12 md:left-0 md:bg-transparent md:border-none md:p-0 md:rounded-xl md:animate-none"
                style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}
              >
                <div className="w-10 h-1 rounded-full mb-3 md:hidden" style={{ background: 'var(--border)' }} />
                <div className="w-full max-w-sm px-4 md:px-0">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme={isDark ? Theme.DARK : Theme.LIGHT}
                    width="100%"
                    height={380}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la categoría…"
          className="flex-1 min-w-[140px] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />

        <button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          {createMutation.isPending
            ? <Loader2 size={15} className="animate-spin" />
            : <><Plus size={15} /><span>Añadir</span></>
          }
        </button>
      </form>

      {/* Category lists */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gastos */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5 px-0.5" style={{ color: 'var(--text-muted)' }}>
              Gastos ({expenses.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {expenses.map(cat => (
                <div
                  key={cat.id}
                  className="group flex flex-col items-center text-center p-3 rounded-2xl gap-1.5 relative transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-2xl leading-none">{cat.icon || '🏷️'}</span>
                  <span className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {cat.name}
                  </span>
                  <button
                    onClick={() => setCategoryToDelete(cat.id)}
                    disabled={deleteMutation.isPending}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="col-span-2 text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                  Sin categorías de gasto aún.
                </p>
              )}
            </div>
          </div>

          {/* Ingresos */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5 px-0.5" style={{ color: 'var(--text-muted)' }}>
              Ingresos ({incomes.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {incomes.map(cat => (
                <div
                  key={cat.id}
                  className="group flex flex-col items-center text-center p-3 rounded-2xl gap-1.5 relative transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-2xl leading-none">{cat.icon || '🏷️'}</span>
                  <span className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {cat.name}
                  </span>
                  <button
                    onClick={() => setCategoryToDelete(cat.id)}
                    disabled={deleteMutation.isPending}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {incomes.length === 0 && (
                <p className="col-span-2 text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                  Sin categorías de ingreso aún.
                </p>
              )}
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
        title="Eliminar categoría"
        message="¿Estás seguro? Borrar esta categoría eliminará permanentemente todas las transacciones y reglas asociadas."
      />
    </div>
  );
}
