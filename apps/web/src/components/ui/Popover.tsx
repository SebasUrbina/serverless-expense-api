'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const VIEWPORT_MARGIN = 16;

/**
 * Open state for a popover anchored to its wrapper (`ref`). Closes on outside
 * pointer down and on Escape, returning focus to the trigger.
 */
export function usePopover<T extends HTMLElement = HTMLDivElement>(
  panelWidth = 288,
) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef<T>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setAlignRight(
        rect.left + panelWidth > window.innerWidth - VIEWPORT_MARGIN,
      );
    }
    setOpen((value) => !value);
  }, [panelWidth]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      ref.current
        ?.querySelector<HTMLElement>('[data-popover-trigger]')
        ?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return { open, toggle, close, ref, alignRight };
}

export function PopoverPanel({
  alignRight,
  label,
  width,
  children,
}: {
  alignRight: boolean;
  label: string;
  width: number;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-label={label}
      style={{ width }}
      className={`bg-card border-border shadow-elevated absolute top-full z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl border p-2 ${alignRight ? 'right-0' : 'left-0'}`}
    >
      {children}
    </div>
  );
}

export type Option<V extends string | number> = {
  value: V;
  label: string;
  icon?: string;
  color?: string;
};

export function OptionList<V extends string | number>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: Option<V>[];
  value: V | '';
  onSelect: (value: V | '') => void;
}) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className="flex max-h-72 flex-col gap-0.5 overflow-y-auto"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(selected ? '' : option.value)}
            className={`focus-ring flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium transition-colors ${
              selected
                ? 'bg-accent-soft text-accent'
                : 'text-primary hover:bg-inset'
            }`}
          >
            {option.color && (
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: option.color }}
              />
            )}
            {option.icon && (
              <span aria-hidden="true" className="shrink-0">
                {option.icon}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
