'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/usePreferences';
import { Plus, Trash2, Hash } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
    createMutation.mutate(
      { name: name.trim() },
      {
        onSuccess: () => setName(''),
      },
    );
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border-border-subtle space-y-3 rounded-2xl border p-3"
      >
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <label className="text-muted mb-1 block px-0.5 text-[10px] font-semibold tracking-wider uppercase sm:hidden">
              Nombre de la etiqueta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. vacaciones, trabajo, casa"
              className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-xl border px-3.5 py-3 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="bg-accent flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 sm:px-5"
          >
            {createMutation.isPending ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <Plus size={14} />
                <span>Agregar etiqueta</span>
              </>
            )}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner color="muted" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group bg-card border-border text-primary hover:bg-card-hover flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all"
            >
              <Hash size={12} className="text-muted" />
              <span>{tag.name}</span>
              <button
                onClick={() => setTagToDelete(tag.id)}
                disabled={deleteMutation.isPending}
                className="ml-0.5 text-red-400 transition-opacity hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-muted w-full py-2 text-sm">
              Aún no tienes etiquetas. Agrega una para empezar a organizar.
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
