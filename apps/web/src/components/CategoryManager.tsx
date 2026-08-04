'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/usePreferences';
import {
  Plus,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/store/useTheme';
import type { Category } from '@/types/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const updateMutation = useUpdateCategory();
  const { resolvedTheme } = useTheme();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('💰');
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<
    'create' | number | null
  >(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Category['type']>('expense');
  const [editIcon, setEditIcon] = useState('💰');

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setEmojiPickerTarget(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = data?.categories || [];
  const expenses = categories.filter((c) => c.type === 'expense');
  const incomes = categories.filter((c) => c.type === 'income');
  const isDark = resolvedTheme() === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), type, icon },
      {
        onSuccess: () => {
          setName('');
          setIcon('💰');
        },
      },
    );
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (emojiPickerTarget === 'create') {
      setIcon(emojiData.emoji);
    } else if (typeof emojiPickerTarget === 'number') {
      setEditIcon(emojiData.emoji);
    }
    setEmojiPickerTarget(null);
  };

  const beginEditing = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
    setEditType(category.type);
    setEditIcon(category.icon || '🏷️');
    setEmojiPickerTarget(null);
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEmojiPickerTarget(null);
    setEditName('');
    setEditType('expense');
    setEditIcon('💰');
  };

  const saveCategory = (categoryId: number) => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    updateMutation.mutate(
      {
        id: categoryId,
        name: trimmedName,
        type: editType,
        icon: editIcon,
      },
      {
        onSuccess: () => {
          cancelEditing();
        },
      },
    );
  };

  const renderCategoryList = (items: typeof categories, emptyMsg: string) => (
    <div className="space-y-1.5">
      {items.length > 0 ? (
        items.map((cat) => (
          <div
            key={cat.id}
            className={`bg-card rounded-xl border px-3 py-2.5 transition-colors ${
              editingCategoryId === cat.id
                ? 'border-border'
                : 'border-border-subtle'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 text-lg leading-none">
                {cat.icon || '🏷️'}
              </span>
              <span className="text-primary min-w-0 flex-1 truncate text-sm font-medium">
                {cat.name}
              </span>
              <button
                type="button"
                onClick={() => beginEditing(cat)}
                disabled={updateMutation.isPending || deleteMutation.isPending}
                className="bg-inset border-border text-primary hover:bg-card-hover inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                aria-label={`Editar categoría ${cat.name}`}
                title="Editar"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => setCategoryToDelete(cat.id)}
                disabled={deleteMutation.isPending || updateMutation.isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                aria-label={`Eliminar categoría ${cat.name}`}
                title="Eliminar"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {editingCategoryId === cat.id && (
              <div className="bg-inset border-border-subtle mt-2.5 space-y-2.5 rounded-xl border p-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEmojiPickerTarget(
                        emojiPickerTarget === cat.id ? null : cat.id,
                      )
                    }
                    className="bg-card border-border flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base transition-all"
                    aria-label="Editar ícono"
                  >
                    {editIcon}
                  </button>

                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveCategory(cat.id);
                      }
                      if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="bg-card border-border flex gap-0.5 rounded-lg border p-0.5">
                    {(['expense', 'income'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setEditType(option)}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                          editType === option
                            ? option === 'expense'
                              ? 'bg-red-500 text-white'
                              : 'bg-emerald-500 text-white'
                            : 'text-muted bg-transparent'
                        }`}
                      >
                        {option === 'expense' ? 'Gasto' : 'Ingreso'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveCategory(cat.id)}
                      disabled={!editName.trim() || updateMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      aria-label="Guardar cambios"
                      title="Guardar"
                    >
                      {updateMutation.isPending ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="bg-card border-border text-secondary hover:text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                      aria-label="Cancelar edición"
                      title="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-muted px-3 py-3 text-xs">{emptyMsg}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="bg-card border-border-subtle rounded-2xl border p-3 sm:p-0">
          <div className="space-y-3 sm:space-y-0">
            {/* Mobile-first controls row */}
            <div className="flex items-center gap-2 sm:mb-3 sm:gap-3">
              {/* Type toggle */}
              <div className="bg-inset border-border flex flex-1 gap-0.5 rounded-xl border p-0.5 sm:flex-none">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-none sm:px-4 ${
                      type === t
                        ? t === 'expense'
                          ? 'bg-red-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'text-muted bg-transparent'
                    }`}
                  >
                    {t === 'expense' ? 'Gasto' : 'Ingreso'}
                  </button>
                ))}
              </div>

              {/* Emoji picker */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setEmojiPickerTarget(
                      emojiPickerTarget === 'create' ? null : 'create',
                    )
                  }
                  className="bg-inset border-border flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition-all hover:scale-110"
                  aria-label="Elegir ícono"
                >
                  {icon}
                </button>
                {emojiPickerTarget === 'create' && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
                      onClick={() => setEmojiPickerTarget(null)}
                    />
                    <div
                      ref={emojiPickerRef}
                      className="bg-card border-border fixed inset-x-0 bottom-0 z-50 flex flex-col items-center rounded-t-3xl border-t pt-2 pb-8 shadow-2xl md:absolute md:inset-auto md:top-12 md:left-0 md:rounded-xl md:border-none md:bg-transparent md:p-0"
                    >
                      <div className="bg-border mb-3 h-1 w-10 rounded-full md:hidden" />
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
            </div>

            {/* Name input row */}
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1">
                <label className="text-muted mb-1 block px-0.5 text-[10px] font-semibold tracking-wider uppercase sm:hidden">
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Supermercado, Sueldo, Transporte"
                  className="focus:ring-accent/30 bg-card border-border text-primary w-full rounded-xl border px-3.5 py-3 text-sm transition-all focus:ring-2 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
                className="bg-accent flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 sm:w-11 sm:px-0"
              >
                {createMutation.isPending ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Plus size={18} />
                    <span className="sm:hidden">Agregar categoría</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Category lists */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner color="muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Gastos */}
          <div>
            <div className="mb-2 flex items-center gap-2 px-1">
              <ArrowDownRight size={13} className="text-red-400" />
              <p className="text-muted text-[11px] font-bold tracking-widest uppercase">
                Gastos ({expenses.length})
              </p>
            </div>
            <div className="bg-inset border-border-subtle overflow-hidden rounded-2xl border p-1.5">
              {renderCategoryList(expenses, 'Sin categorías de gasto aún.')}
            </div>
          </div>

          {/* Ingresos */}
          <div>
            <div className="mb-2 flex items-center gap-2 px-1">
              <ArrowUpRight size={13} className="text-emerald-400" />
              <p className="text-muted text-[11px] font-bold tracking-widest uppercase">
                Ingresos ({incomes.length})
              </p>
            </div>
            <div className="bg-inset border-border-subtle overflow-hidden rounded-2xl border p-1.5">
              {renderCategoryList(incomes, 'Sin categorías de ingreso aún.')}
            </div>
          </div>
        </div>
      )}

      {typeof emojiPickerTarget === 'number' && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
            onClick={() => setEmojiPickerTarget(null)}
          />
          <div
            ref={emojiPickerRef}
            className="bg-card border-border fixed inset-x-0 bottom-0 z-50 flex flex-col items-center rounded-t-3xl border pt-2 pb-8 shadow-2xl md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
          >
            <div className="bg-border mb-3 h-1 w-10 rounded-full md:hidden" />
            <div className="w-full max-w-sm px-4 md:px-4 md:pb-4">
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

      <ConfirmDeleteModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete !== null)
            deleteMutation.mutate(categoryToDelete);
        }}
        title="Eliminar categoría"
        message="¿Estás seguro? Borrar esta categoría eliminará permanentemente todas las transacciones y reglas asociadas."
      />
    </div>
  );
}
