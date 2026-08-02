'use client';

import { useState, useRef, useEffect } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, ArrowDownRight, ArrowUpRight, Pencil, Check, X } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/store/useTheme';
import type { Category } from '@/types/api';

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const updateMutation = useUpdateCategory();
  const { resolvedTheme } = useTheme();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('💰');
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'create' | number | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Category['type']>('expense');
  const [editIcon, setEditIcon] = useState('💰');

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEmojiPickerTarget(null);
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
      }
    );
  };

  const renderCategoryList = (items: typeof categories, emptyMsg: string) => (
    <div className="space-y-1.5">
      {items.length > 0 ? items.map(cat => (
        <div
          key={cat.id}
          className="rounded-xl px-3 py-2.5 transition-colors"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${editingCategoryId === cat.id ? 'var(--border)' : 'var(--border-subtle)'}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg leading-none shrink-0">{cat.icon || '🏷️'}</span>
            <span className="min-w-0 flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {cat.name}
            </span>
            <button
              type="button"
              onClick={() => beginEditing(cat)}
              disabled={updateMutation.isPending || deleteMutation.isPending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              aria-label={`Editar categoría ${cat.name}`}
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => setCategoryToDelete(cat.id)}
              disabled={deleteMutation.isPending || updateMutation.isPending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors text-red-500"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.16)',
              }}
              aria-label={`Eliminar categoría ${cat.name}`}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {editingCategoryId === cat.id && (
            <div
              className="mt-2.5 space-y-2.5 rounded-xl p-2.5"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmojiPickerTarget(emojiPickerTarget === cat.id ? null : cat.id)}
                  className="w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all shrink-0"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {(['expense', 'income'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setEditType(option)}
                      className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                      style={{
                        background: editType === option ? (option === 'expense' ? '#f43f5e' : '#10b981') : 'transparent',
                        color: editType === option ? 'white' : 'var(--text-muted)',
                      }}
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ background: '#10b981' }}
                  aria-label="Guardar cambios"
                  title="Guardar"
                >
                  {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
      )) : (
        <p className="text-xs py-3 px-3" style={{ color: 'var(--text-muted)' }}>{emptyMsg}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div
          className="rounded-2xl p-3 sm:p-0"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="space-y-3 sm:space-y-0">
            {/* Mobile-first controls row */}
            <div className="flex items-center gap-2 sm:gap-3 sm:mb-3">
          {/* Type toggle */}
              <div
                className="flex flex-1 sm:flex-none rounded-xl p-0.5 gap-0.5"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
              >
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all"
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
                  onClick={() => setEmojiPickerTarget(emojiPickerTarget === 'create' ? null : 'create')}
                  className="w-11 h-11 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
                  aria-label="Elegir ícono"
                >
                  {icon}
                </button>
                {emojiPickerTarget === 'create' && (
                  <>
                    <div
                      className="fixed inset-0 z-40 md:hidden"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                      onClick={() => setEmojiPickerTarget(null)}
                    />
                    <div
                      ref={emojiPickerRef}
                      className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center rounded-t-3xl pt-2 pb-8 shadow-2xl md:absolute md:inset-auto md:top-12 md:left-0 md:bg-transparent md:border-none md:p-0 md:rounded-xl"
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
            </div>

            {/* Name input row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 px-0.5 sm:hidden" style={{ color: 'var(--text-muted)' }}>
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Supermercado, Sueldo, Transporte"
                  className="w-full rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
                className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white h-11 px-4 sm:w-11 sm:px-0 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {createMutation.isPending
                  ? <Loader2 size={16} className="animate-spin" />
                  : <><Plus size={18} /><span className="sm:hidden">Agregar categoría</span></>
                }
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Category lists */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Gastos */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <ArrowDownRight size={13} className="text-red-400" />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Gastos ({expenses.length})
              </p>
            </div>
            <div
              className="rounded-2xl p-1.5 overflow-hidden"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
            >
              {renderCategoryList(expenses, 'Sin categorías de gasto aún.')}
            </div>
          </div>

          {/* Ingresos */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <ArrowUpRight size={13} className="text-emerald-400" />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Ingresos ({incomes.length})
              </p>
            </div>
            <div
              className="rounded-2xl p-1.5 overflow-hidden"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
            >
              {renderCategoryList(incomes, 'Sin categorías de ingreso aún.')}
            </div>
          </div>
        </div>
      )}

      {typeof emojiPickerTarget === 'number' && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setEmojiPickerTarget(null)}
          />
          <div
            ref={emojiPickerRef}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center rounded-t-3xl pt-2 pb-8 shadow-2xl md:left-1/2 md:bottom-auto md:top-1/2 md:w-full md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
            style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', border: '1px solid var(--border)' }}
          >
            <div className="w-10 h-1 rounded-full mb-3 md:hidden" style={{ background: 'var(--border)' }} />
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
          if (categoryToDelete !== null) deleteMutation.mutate(categoryToDelete);
        }}
        title="Eliminar categoría"
        message="¿Estás seguro? Borrar esta categoría eliminará permanentemente todas las transacciones y reglas asociadas."
      />
    </div>
  );
}
