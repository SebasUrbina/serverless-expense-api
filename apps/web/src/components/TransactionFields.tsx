'use client';

import type { RefObject } from 'react';
import { X } from 'lucide-react';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import type { Account, Category, Tag } from '@/types/api';

type MovementType = 'expense' | 'income';

const pillClass = (selected: boolean) =>
  `focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    selected
      ? 'bg-accent-soft text-accent border-transparent'
      : 'border-border text-secondary hover:text-primary'
  }`;

export const formatAmountInput = (value: string) => {
  const raw = value.replace(/\D/g, '');
  return raw ? new Intl.NumberFormat('es-CL').format(parseInt(raw, 10)) : '';
};

export const parseAmountInput = (value: string) =>
  value ? parseInt(value.replace(/\./g, ''), 10) || 0 : 0;

const LAST_ACCOUNT_KEY = 'seva:last-account-id';

/** The account used in the last saved movement or rule, if any. */
export function readLastAccount(): number | null {
  if (typeof window === 'undefined') return null;
  const stored = Number(window.localStorage.getItem(LAST_ACCOUNT_KEY));
  return Number.isInteger(stored) && stored > 0 ? stored : null;
}

export function rememberAccount(id: number) {
  window.localStorage.setItem(LAST_ACCOUNT_KEY, String(id));
}

/**
 * The account to show as selected: the one chosen in the form, or for new
 * entries the last one used (or the only one).
 */
export function resolveAccount(
  chosen: number | '',
  accounts: Account[],
  lastUsed: number | null,
  isNew: boolean,
): number | '' {
  if (chosen !== '') return chosen;
  if (!isNew) return '';
  if (accounts.some((a) => a.id === lastUsed)) return lastUsed!;
  return accounts.length === 1 ? accounts[0]!.id : '';
}

export function accountIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'cash':
      return '💵';
    case 'checking':
      return '🏦';
    case 'savings':
      return '🐷';
    case 'credit':
      return '💳';
    default:
      return '💰';
  }
}

/** Sticky header: Cancelar / title / Guardar on mobile, title / close on desktop. */
export function FormModalHeader({
  title,
  formId,
  saving,
  onClose,
}: {
  title: string;
  formId: string;
  saving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="bg-card/90 sticky top-0 z-30 flex items-center justify-between px-4 pt-5 pb-4 backdrop-blur sm:p-6">
      <button
        type="button"
        onClick={onClose}
        className="bg-inset text-primary hover:bg-border focus-ring rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:hidden"
      >
        Cancelar
      </button>
      <h2 className="text-primary absolute left-1/2 -translate-x-1/2 text-lg font-bold sm:static sm:translate-x-0 sm:text-xl">
        {title}
      </h2>
      <button
        type="submit"
        form={formId}
        disabled={saving}
        className="bg-accent text-on-accent focus-ring rounded-full px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 sm:hidden"
      >
        Guardar
      </button>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="bg-inset text-muted hover:bg-card-hover hover:text-primary focus-ring hidden rounded-full p-2 transition-colors sm:block"
      >
        <X size={20} />
      </button>
    </div>
  );
}

export function TypeToggle({
  value,
  onChange,
}: {
  value: MovementType;
  onChange: (value: MovementType) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de movimiento"
      className="bg-inset flex rounded-xl p-1"
    >
      {(['expense', 'income'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={`focus-ring flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${value === t ? 'bg-card text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
        >
          {t === 'expense' ? 'Gasto' : 'Ingreso'}
        </button>
      ))}
    </div>
  );
}

export function AmountInput({
  value,
  onChange,
  type,
  autoFocus,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  type: MovementType;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const color =
    type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)';
  return (
    <label className="flex items-baseline justify-center">
      <span className="sr-only">Monto</span>
      <span
        aria-hidden="true"
        className="mr-1 text-2xl font-bold"
        style={{ color }}
      >
        $
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(formatAmountInput(e.target.value))}
        className="placeholder:text-muted min-w-[2ch] bg-transparent p-0 text-center text-5xl font-extrabold tracking-tight tabular-nums focus:outline-none"
        style={{ width: `${Math.max(value.length, 1) + 0.5}ch`, color }}
        placeholder="0"
      />
    </label>
  );
}

export function CategoryPicker({
  categories,
  loading,
  value,
  onChange,
  containerRef,
}: {
  categories: Category[];
  loading: boolean;
  value: number | '';
  onChange: (id: number) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
}) {
  const categoryColors = useCategoryColors();
  return (
    <div ref={containerRef}>
      <p
        id="category-label"
        className="text-secondary mb-2 text-sm font-semibold"
      >
        Categoría
      </p>
      <div
        role="radiogroup"
        aria-labelledby="category-label"
        className="grid grid-cols-4 gap-1.5 sm:grid-cols-5"
      >
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="bg-inset h-[72px] animate-pulse rounded-2xl"
              />
            ))
          : categories.map((cat) => {
              const isSelected = value === cat.id;
              const color = categoryColors.get(cat.id) ?? 'var(--text-muted)';
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChange(cat.id)}
                  className={`focus-ring flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent-soft'
                      : 'hover:bg-inset border-transparent'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                    style={{
                      background: `color-mix(in srgb, ${color} 18%, transparent)`,
                    }}
                  >
                    {cat.icon || '🏷️'}
                  </span>
                  <span
                    className={`line-clamp-2 text-center text-[11px] leading-tight font-semibold ${isSelected ? 'text-accent' : 'text-primary'}`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
      </div>
    </div>
  );
}

export function AccountPicker({
  accounts,
  loading,
  value,
  onChange,
  containerRef,
}: {
  accounts: Account[];
  loading: boolean;
  value: number | '';
  onChange: (id: number) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={containerRef}>
      <p
        id="account-label"
        className="text-secondary mb-2 text-sm font-semibold"
      >
        Cuenta
      </p>
      <div
        role="radiogroup"
        aria-labelledby="account-label"
        className="flex flex-wrap gap-2"
      >
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="bg-inset h-10 w-28 animate-pulse rounded-xl"
              />
            ))
          : accounts.map((acc) => {
              const isSelected = value === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChange(acc.id)}
                  className={`focus-ring flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-secondary hover:text-primary'
                  }`}
                >
                  <span aria-hidden="true">{accountIcon(acc.type)}</span>
                  {acc.name}
                </button>
              );
            })}
      </div>
    </div>
  );
}

export function TagPicker({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div>
      <p id="tags-label" className="text-secondary mb-2 text-sm font-semibold">
        Etiquetas
      </p>
      <div
        role="group"
        aria-labelledby="tags-label"
        className="flex flex-wrap gap-2"
      >
        {tags.map((tag) => {
          const isSelected = value.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() =>
                onChange(
                  isSelected
                    ? value.filter((id) => id !== tag.id)
                    : [...value, tag.id],
                )
              }
              className={pillClass(isSelected)}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Choice among a few short options, e.g. presets. */
export function PillChoice<V extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={pillClass(value === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/** Focus the first control inside a field and bring it into view. */
export function focusField(target: RefObject<HTMLElement | null>) {
  const el = target.current;
  const focusable =
    el instanceof HTMLInputElement
      ? el
      : el?.querySelector<HTMLElement>('button, input');
  focusable?.focus();
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
