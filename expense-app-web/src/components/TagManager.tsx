'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Hash } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function TagManager() {
  const { data, isLoading } = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();

  const [name, setName] = useState('');
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);

  const tags = data?.tags || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim() }, {
      onSuccess: () => setName('')
    });
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-3 space-y-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 px-0.5 sm:hidden" style={{ color: 'var(--text-muted)' }}>
              Nombre de la etiqueta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. vacaciones, trabajo, casa"
              className="w-full rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white h-11 px-4 sm:px-5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {createMutation.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <><Plus size={14} /><span>Añadir etiqueta</span></>
            }
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <Hash size={12} style={{ color: 'var(--text-muted)' }} />
              <span>{tag.name}</span>
              <button
                onClick={() => setTagToDelete(tag.id)}
                disabled={deleteMutation.isPending}
                className="ml-0.5 text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-sm w-full py-2" style={{ color: 'var(--text-muted)' }}>
              Sin etiquetas aún. Añade una para empezar a organizar.
            </p>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={tagToDelete !== null}
        onClose={() => setTagToDelete(null)}
        onConfirm={() => {
          if (tagToDelete !== null) deleteMutation.mutate(tagToDelete);
        }}
        title="Eliminar etiqueta"
        message="¿Estás seguro? Borrar esta etiqueta eliminará su asociación en todas las transacciones."
      />
    </div>
  );
}
