'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/usePreferences';
import { Plus, X } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PrimaryButton, SettingsListEmpty, fieldClass } from './settings/ui';

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
      { onSuccess: () => setName('') },
    );
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner color="muted" />
        </div>
      ) : tags.length > 0 ? (
        <ul aria-label="Tus etiquetas" className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="bg-inset text-primary flex h-9 items-center gap-1 rounded-full pr-1 pl-3.5 text-sm font-medium"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => setTagToDelete(tag.id)}
                disabled={deleteMutation.isPending}
                aria-label={`Eliminar etiqueta ${tag.name}`}
                className="text-muted hover:text-expense focus-ring flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-red-500/10"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <SettingsListEmpty>
          Aún no tienes etiquetas. Úsalas para agrupar movimientos de distintas
          categorías, como un viaje o un proyecto.
        </SettingsListEmpty>
      )}

      <form onSubmit={handleSubmit} aria-label="Nueva etiqueta">
        <h3 className="text-primary mb-3 text-sm font-semibold">
          Nueva etiqueta
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Nombre de la etiqueta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. vacaciones, trabajo, casa"
            className={fieldClass}
          />
          <PrimaryButton
            type="submit"
            loading={createMutation.isPending}
            disabled={!name.trim()}
          >
            <Plus size={16} aria-hidden="true" />
            Agregar
          </PrimaryButton>
        </div>
      </form>

      <ConfirmDeleteModal
        isOpen={tagToDelete !== null}
        onClose={() => setTagToDelete(null)}
        onConfirm={() => {
          if (tagToDelete !== null) deleteMutation.mutate(tagToDelete);
        }}
        title="Eliminar etiqueta"
        message="La etiqueta se quitará de todos los movimientos que la usan."
      />
    </div>
  );
}
