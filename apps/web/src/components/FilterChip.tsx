'use client';

import type { ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { PopoverPanel, usePopover } from './ui/Popover';

const chipClass = (active: boolean) =>
  `focus-ring inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border text-[13px] font-semibold transition-colors ${
    active
      ? 'bg-accent-soft text-accent border-transparent'
      : 'bg-card border-border text-secondary hover:text-primary'
  }`;

/** A filter that switches on or off with one tap. */
export function ToggleChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`${chipClass(active)} px-3.5`}
    >
      {label}
    </button>
  );
}

/**
 * A filter chip that opens a menu. While active it shows the chosen value and
 * a separate button to clear it.
 */
export function MenuChip({
  label,
  menuLabel,
  active,
  onClear,
  panelWidth = 256,
  children,
}: {
  label: string;
  /** Accessible name for the menu, e.g. "Elegir categoría". */
  menuLabel: string;
  active: boolean;
  onClear: () => void;
  panelWidth?: number;
  children: (close: () => void) => ReactNode;
}) {
  const { open, toggle, close, ref, alignRight } =
    usePopover<HTMLDivElement>(panelWidth);

  return (
    <div ref={ref} className="relative">
      <span className={chipClass(active)}>
        <button
          type="button"
          data-popover-trigger
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`focus-ring flex h-full items-center gap-1.5 rounded-full pl-3.5 ${active ? 'pr-1' : 'pr-3'}`}
        >
          {label}
          {!active && (
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        {active && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Quitar filtro ${label}`}
            className="focus-ring hover:bg-accent/15 mr-1 flex h-7 w-7 items-center justify-center rounded-full"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </span>
      {open && (
        <PopoverPanel
          alignRight={alignRight}
          label={menuLabel}
          width={panelWidth}
        >
          {children(close)}
        </PopoverPanel>
      )}
    </div>
  );
}
