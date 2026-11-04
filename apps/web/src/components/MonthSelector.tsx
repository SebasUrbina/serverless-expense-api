'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { format, parseISO, addMonths, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { PopoverPanel, usePopover } from './ui/Popover';

const PANEL_WIDTH = 288;
const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i);

type MonthSelectorProps = {
  value: string; // YYYY-MM, or '' for every month
  onChange: (value: string) => void;
  className?: string;
  /** Offer "Todos los meses" (empty value). */
  allowAll?: boolean;
  /**
   * `stepper` shows previous/next arrows around the month (page headers);
   * `chip` is a filter chip that can be cleared (filter bars).
   */
  variant?: 'stepper' | 'chip';
};

const monthKey = (year: number, index: number) =>
  `${year}-${String(index + 1).padStart(2, '0')}`;

function MonthPicker({
  value,
  allowAll,
  onSelect,
}: {
  value: string;
  allowAll: boolean;
  onSelect: (value: string) => void;
}) {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const lastMonth = format(addMonths(now, -1), 'yyyy-MM');
  const maxYear = now.getFullYear() + 1;
  const [year, setYear] = useState(
    value ? Number(value.slice(0, 4)) : now.getFullYear(),
  );

  const quick = [
    { label: 'Este mes', value: currentMonth },
    { label: 'Mes pasado', value: lastMonth },
    ...(allowAll ? [{ label: 'Todos los meses', value: '' }] : []),
  ];

  return (
    <>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          aria-label="Año anterior"
          className="text-secondary hover:text-primary hover:bg-inset focus-ring flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-primary text-sm font-bold tabular-nums">
          {year}
        </span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= maxYear}
          aria-label="Año siguiente"
          className="text-secondary hover:text-primary hover:bg-inset focus-ring flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {MONTH_INDEXES.map((index) => {
          const key = monthKey(year, index);
          const selected = key === value;
          const isCurrent = key === currentMonth;
          const future = key > currentMonth;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              aria-current={isCurrent ? 'date' : undefined}
              aria-label={format(parseISO(`${key}-01`), 'MMMM yyyy', {
                locale: es,
              })}
              onClick={() => onSelect(key)}
              className={`focus-ring h-10 rounded-xl text-[13px] font-semibold capitalize transition-colors ${
                selected
                  ? 'bg-accent text-on-accent'
                  : isCurrent
                    ? 'text-accent ring-accent hover:bg-accent-soft ring-1 ring-inset'
                    : future
                      ? 'text-muted hover:bg-inset'
                      : 'text-primary hover:bg-inset'
              }`}
            >
              {format(parseISO(`${key}-01`), 'MMM', { locale: es }).replace(
                '.',
                '',
              )}
            </button>
          );
        })}
      </div>

      <div className="border-border mt-2 flex flex-wrap gap-1.5 border-t px-1 pt-2">
        {quick.map((item) => {
          const selected = item.value === value;
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(item.value)}
              className={`focus-ring h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                selected
                  ? 'bg-accent-soft text-accent'
                  : 'bg-inset text-secondary hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function MonthSelector({
  value,
  onChange,
  className = '',
  allowAll = true,
  variant = 'stepper',
}: MonthSelectorProps) {
  const { open, toggle, close, ref, alignRight } =
    usePopover<HTMLDivElement>(PANEL_WIDTH);

  const parsed = value ? parseISO(`${value}-01`) : null;
  const shortLabel =
    parsed && isValid(parsed)
      ? format(parsed, 'MMM yyyy', { locale: es }).replace('.', '')
      : 'Todos los meses';

  const select = (month: string) => {
    onChange(month);
    close();
  };
  const shiftMonth = (delta: number) => {
    const base = parsed && isValid(parsed) ? parsed : new Date();
    onChange(format(addMonths(base, delta), 'yyyy-MM'));
  };

  const panel = open && (
    <PopoverPanel
      alignRight={alignRight}
      label="Elegir mes"
      width={PANEL_WIDTH}
    >
      <MonthPicker value={value} allowAll={allowAll} onSelect={select} />
    </PopoverPanel>
  );

  if (variant === 'chip') {
    const active = !!value;
    return (
      <div ref={ref} className={`relative ${className}`}>
        <span
          className={`inline-flex h-9 items-center rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors ${
            active
              ? 'bg-accent-soft text-accent border-transparent'
              : 'bg-card border-border text-secondary hover:text-primary'
          }`}
        >
          <button
            type="button"
            data-popover-trigger
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`focus-ring flex h-full items-center gap-1.5 rounded-full pl-3.5 capitalize ${active && allowAll ? 'pr-1' : 'pr-3'}`}
          >
            {shortLabel}
            {!(active && allowAll) && (
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform ${open ? 'rotate-180' : ''}`}
              />
            )}
          </button>
          {active && allowAll && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Quitar filtro de mes"
              className="focus-ring hover:bg-accent/15 mr-1 flex h-7 w-7 items-center justify-center rounded-full"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </span>
        {panel}
      </div>
    );
  }

  const arrowClass =
    'text-secondary hover:text-primary hover:bg-inset focus-ring flex h-full w-8 items-center justify-center rounded-lg transition-colors';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="bg-card border-border flex h-10 max-w-full items-center rounded-xl border p-0.5">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className={arrowClass}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          data-popover-trigger
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="hover:bg-inset text-primary focus-ring flex h-full min-w-[92px] flex-1 items-center justify-center gap-1 rounded-lg px-2.5 text-sm font-semibold capitalize transition-colors"
        >
          <span className="whitespace-nowrap">{shortLabel}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className={arrowClass}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {panel}
    </div>
  );
}
