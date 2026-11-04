'use client';

import { useRef, useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/usePreferences';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/store/useTheme';
import { useDialog } from '@/hooks/useDialog';
import type { Category } from '@/types/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  PrimaryButton,
  SegmentedControl,
  SettingsList,
  SettingsListEmpty,
  fieldClass,
  secondaryButtonClass,
} from './settings/ui';

type CategoryType = Category['type'];

const typeOptions: { value: CategoryType; label: string }[] = [
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
];

function EmojiButton({
  emoji,
  onClick,
}: {
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ícono ${emoji}, cambiar`}
      className="bg-card border-border hover:bg-inset focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg transition-colors"
    >
      {emoji}
    </button>
  );
}

function EmojiSheet({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(true, onClose, ref);
  return (
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-[var(--backdrop-bg)] md:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Elegir ícono"
        tabIndex={-1}
        className="bg-card border-border shadow-elevated w-full max-w-sm rounded-t-3xl border p-4 pb-8 focus:outline-none md:rounded-3xl md:pb-4"
      >
        <EmojiPicker
          onEmojiClick={(data: EmojiClickData) => onPick(data.emoji)}
          theme={resolvedTheme() === 'dark' ? Theme.DARK : Theme.LIGHT}
          width="100%"
          height={380}
        />
      </div>
    </div>
  );
}

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const updateMutation = useUpdateCategory();

  const [tab, setTab] = useState<CategoryType>('expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CategoryType>('expense');
  const [editIcon, setEditIcon] = useState('💰');
  const [pickerFor, setPickerFor] = useState<'create' | 'edit' | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const categories = (data?.categories || []).filter((c) => c.type === tab);
  const busy = updateMutation.isPending || deleteMutation.isPending;

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), type: tab, icon },
      {
        onSuccess: () => {
          setName('');
          setIcon('💰');
        },
      },
    );
  };

  const save = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate(
      { id, name: editName.trim(), type: editType, icon: editIcon },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <div className="space-y-6">
      <SegmentedControl
        label="Tipo de categoría"
        value={tab}
        options={typeOptions}
        onChange={(value) => {
          setTab(value);
          setEditingId(null);
        }}
        className="sm:max-w-xs"
      />

      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner color="muted" />
        </div>
      ) : categories.length > 0 ? (
        <SettingsList
          label={
            tab === 'expense' ? 'Categorías de gasto' : 'Categorías de ingreso'
          }
        >
          {categories.map((cat) =>
            editingId === cat.id ? (
              <li key={cat.id} className="bg-inset p-4">
                <form onSubmit={(e) => save(e, cat.id)} className="space-y-3">
                  <div className="flex gap-2">
                    <EmojiButton
                      emoji={editIcon}
                      onClick={() => setPickerFor('edit')}
                    />
                    <input
                      autoFocus
                      aria-label="Nombre de la categoría"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SegmentedControl
                      label="Tipo"
                      value={editType}
                      options={[
                        { value: 'expense', label: 'Gasto' },
                        { value: 'income', label: 'Ingreso' },
                      ]}
                      onChange={setEditType}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(cat.id)}
                        aria-label={`Eliminar ${cat.name}`}
                        className="text-expense focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={secondaryButtonClass}
                      >
                        Cancelar
                      </button>
                      <PrimaryButton
                        type="submit"
                        loading={updateMutation.isPending}
                        disabled={!editName.trim()}
                      >
                        Guardar
                      </PrimaryButton>
                    </div>
                  </div>
                </form>
              </li>
            ) : (
              <li key={cat.id}>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Editar ${cat.name}`}
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditName(cat.name);
                    setEditType(cat.type);
                    setEditIcon(cat.icon || '🏷️');
                  }}
                  className="hover:bg-inset focus-ring flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="bg-inset flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  >
                    {cat.icon || '🏷️'}
                  </span>
                  <span className="text-primary min-w-0 flex-1 truncate text-sm font-medium">
                    {cat.name}
                  </span>
                  <Pencil
                    size={14}
                    aria-hidden="true"
                    className="text-muted shrink-0"
                  />
                </button>
              </li>
            ),
          )}
        </SettingsList>
      ) : (
        <SettingsListEmpty>
          {tab === 'expense'
            ? 'Aún no tienes categorías de gasto.'
            : 'Aún no tienes categorías de ingreso.'}
        </SettingsListEmpty>
      )}

      <form onSubmit={create} aria-label="Nueva categoría">
        <h3 className="text-primary mb-3 text-sm font-semibold">
          {tab === 'expense'
            ? 'Nueva categoría de gasto'
            : 'Nueva categoría de ingreso'}
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 gap-2">
            <EmojiButton emoji={icon} onClick={() => setPickerFor('create')} />
            <input
              aria-label="Nombre de la categoría"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                tab === 'expense' ? 'Ej. Supermercado' : 'Ej. Sueldo'
              }
              className={fieldClass}
            />
          </div>
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

      {pickerFor && (
        <EmojiSheet
          onClose={() => setPickerFor(null)}
          onPick={(emoji) => {
            if (pickerFor === 'create') setIcon(emoji);
            else setEditIcon(emoji);
            setPickerFor(null);
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete === null) return;
          deleteMutation.mutate(categoryToDelete);
          setEditingId(null);
        }}
        title="Eliminar categoría"
        message="Se eliminarán permanentemente todos los movimientos y reglas recurrentes de esta categoría."
      />
    </div>
  );
}
