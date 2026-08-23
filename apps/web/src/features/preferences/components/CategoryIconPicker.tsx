'use client';

import { useState, type FormEvent } from 'react';
import { Check, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import {
  CATEGORY_ICON_GROUPS,
  isSingleEmoji,
} from '@/features/preferences/model/category-icons';

type CategoryIconPickerProps = {
  isOpen: boolean;
  selectedIcon: string;
  onClose: () => void;
  onSelect: (icon: string) => void;
};

export function CategoryIconPicker({
  isOpen,
  selectedIcon,
  onClose,
  onSelect,
}: CategoryIconPickerProps) {
  const [customIcon, setCustomIcon] = useState('');
  const [customIconError, setCustomIconError] = useState<string | null>(null);

  const closePicker = () => {
    setCustomIcon('');
    setCustomIconError(null);
    onClose();
  };

  const selectIcon = (icon: string) => {
    onSelect(icon);
    closePicker();
  };

  const submitCustomIcon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextIcon = customIcon.trim();
    if (!isSingleEmoji(nextIcon)) {
      setCustomIconError('Pega un solo emoji.');
      return;
    }
    selectIcon(nextIcon);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closePicker}
      ariaLabel="Elegir ícono de categoría"
      maxWidth="max-w-md"
      lockScroll
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-6">
        <div>
          <h2 className="text-primary text-lg font-bold">Elegir ícono</h2>
          <p className="text-muted mt-0.5 text-xs">
            Selecciona el que mejor represente la categoría.
          </p>
        </div>
        <button
          type="button"
          onClick={closePicker}
          className="bg-inset text-muted hover:text-primary inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="Cerrar selector de íconos"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[65dvh] space-y-5 overflow-y-auto px-5 py-3 sm:px-6">
        {CATEGORY_ICON_GROUPS.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h3 className="text-muted mb-2 text-[11px] font-bold tracking-wider uppercase">
              {group.label}
            </h3>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {group.icons.map((candidate) => {
                const isSelected = candidate === selectedIcon;
                return (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => selectIcon(candidate)}
                    aria-label={`Usar ${candidate} como ícono`}
                    aria-pressed={isSelected}
                    className={`flex aspect-square items-center justify-center rounded-xl border text-xl transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                      isSelected
                        ? 'border-accent bg-accent/10'
                        : 'bg-inset border-border-subtle'
                    }`}
                  >
                    {candidate}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <form
          onSubmit={submitCustomIcon}
          className="border-border space-y-2 border-t pt-4"
        >
          <label
            htmlFor="custom-category-icon"
            className="text-secondary block text-xs font-semibold"
          >
            ¿No aparece? Pega otro emoji
          </label>
          <div className="flex gap-2">
            <input
              id="custom-category-icon"
              type="text"
              inputMode="text"
              value={customIcon}
              onChange={(event) => {
                setCustomIcon(event.target.value);
                setCustomIconError(null);
              }}
              maxLength={32}
              placeholder="Ej. 🪴"
              aria-invalid={customIconError !== null}
              aria-describedby={
                customIconError ? 'custom-category-icon-error' : undefined
              }
              className="bg-inset border-border text-primary placeholder:text-muted focus:ring-accent/30 min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-base focus:ring-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customIcon.trim()}
              className="bg-accent inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              aria-label="Usar emoji personalizado"
            >
              <Check size={18} />
            </button>
          </div>
          {customIconError && (
            <p
              id="custom-category-icon-error"
              role="alert"
              className="text-xs text-red-500"
            >
              {customIconError}
            </p>
          )}
        </form>
      </div>

      <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
    </BaseModal>
  );
}
