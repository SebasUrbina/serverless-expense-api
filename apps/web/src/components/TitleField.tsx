'use client';

import { useId, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useCategoryColors } from '@/hooks/useCategoryColors';
import {
  useTitleSuggestions,
  type TitleSuggestion,
} from '@/hooks/useTitleSuggestions';

/**
 * Title input that suggests earlier movements with a matching title; picking
 * one lets the form copy its category, account and amount.
 */
export function TitleField({
  id,
  label,
  value,
  onChange,
  onPick,
  type,
  placeholder,
  hint,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onPick: (suggestion: TitleSuggestion) => void;
  type: 'expense' | 'income';
  placeholder: string;
  hint?: React.ReactNode;
}) {
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const categoryColors = useCategoryColors();
  const suggestions = useTitleSuggestions(value, type).filter(
    (s) => s.title.toLowerCase() !== picked?.toLowerCase(),
  );
  const open = focused && suggestions.length > 0;

  const pick = (suggestion: TitleSuggestion) => {
    setPicked(suggestion.title);
    setActive(-1);
    onPick(suggestion);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="text-secondary mb-2 block text-sm font-semibold"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && active >= 0 ? `${listId}-${active}` : undefined
        }
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setPicked(null);
          setActive(-1);
          onChange(e.target.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            pick(suggestions[active]!);
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            setPicked(value);
          }
        }}
        className="bg-inset text-primary placeholder:text-muted focus:ring-border w-full rounded-xl px-4 py-3 text-base font-medium transition-colors focus:ring-1 focus:outline-none"
        placeholder={placeholder}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Movimientos anteriores"
          className="border-border bg-card mt-1.5 overflow-hidden rounded-xl border"
        >
          {suggestions.map((s, i) => {
            const color =
              (s.category_id != null && categoryColors.get(s.category_id)) ||
              'var(--text-muted)';
            return (
              <li
                key={`${s.title}-${s.type}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // Keep focus in the input so the list doesn't close before the click.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className={`flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 transition-colors ${i === active ? 'bg-inset' : 'hover:bg-inset'}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, transparent)`,
                  }}
                >
                  {s.category_icon || '🏷️'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-primary block truncate text-sm font-semibold">
                    {s.title}
                  </span>
                  <span className="text-muted block truncate text-xs">
                    {[s.category, s.uses > 1 ? `${s.uses} veces` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="text-secondary shrink-0 text-sm font-semibold tabular-nums">
                  ${formatCurrency(s.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        hint
      )}
    </div>
  );
}
