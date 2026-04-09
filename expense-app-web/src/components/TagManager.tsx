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
        className="flex gap-2 items-center rounded-2xl p-3"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        <Hash size={15} style={{ color: 'var(--text-muted)' }} className="shrink-0 ml-1" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nueva etiqueta (ej. vacaciones)…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0"
        >
          {createMutation.isPending
            ? <Loader2 size={14} className="animate-spin" />
            : <><Plus size={14} /><span>Añadir</span></>
          }
        </button>
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
                className="ml-0.5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
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
