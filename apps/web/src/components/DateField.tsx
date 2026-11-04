'use client';

import { useId, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, format, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { monthGrid, recentDates } from '@/lib/calendar';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const chipClass = (selected: boolean) =>
  `focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
    selected
      ? 'bg-primary text-card border-primary'
      : 'border-border text-secondary hover:text-primary'
  }`;

export type DatePreset = { value: string; label: string };

export const shortDayLabel = (date: string) =>
  capitalize(format(parseISO(date), 'EEE d', { locale: es }).replace('.', ''));

/**
 * Date input as one-tap chips plus an inline calendar. Defaults to today,
 * yesterday and the day before; `emptyLabel` adds a chip for "no date" ('').
 */
export function DateField({
  value,
  onChange,
  presets,
  emptyLabel,
  label = 'Fecha',
  align = 'center',
}: {
  value: string; // YYYY-MM-DD, or '' when `emptyLabel` is set
  onChange: (value: string) => void;
  presets?: DatePreset[];
  emptyLabel?: string;
  label?: string;
  align?: 'center' | 'start';
}) {
  const calendarId = useId();
  const now = new Date();
  const [today, yesterday, dayBefore] = recentDates(now) as [
    string,
    string,
    string,
  ];
  const chips = [
    ...(emptyLabel ? [{ value: '', label: emptyLabel }] : []),
    ...(presets ?? [
      { value: today, label: 'Hoy' },
      { value: yesterday, label: 'Ayer' },
      { value: dayBefore, label: shortDayLabel(dayBefore) },
    ]),
  ];
  const isPreset = chips.some((r) => r.value === value);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    value ? parseISO(value) : now,
  );

  const pick = (day: string) => {
    onChange(day);
    setCalendarOpen(false);
  };

  return (
    <div>
      <div
        role="group"
        aria-label={label}
        className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}
      >
        {chips.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={value === r.value}
            onClick={() => pick(r.value)}
            className={chipClass(value === r.value)}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={calendarOpen}
          aria-controls={calendarId}
          onClick={() => {
            setVisibleMonth(value ? parseISO(value) : now);
            setCalendarOpen((open) => !open);
          }}
          className={chipClass(!isPreset)}
        >
          <CalendarDays size={14} aria-hidden="true" />
          {isPreset
            ? 'Otra fecha'
            : capitalize(
                format(parseISO(value), 'EEE d MMM', { locale: es }).replace(
                  /\./g,
                  '',
                ),
              )}
        </button>
      </div>

      {calendarOpen && (
        <div
          id={calendarId}
          className={`bg-inset mt-3 max-w-xs rounded-2xl p-3 ${align === 'center' ? 'mx-auto' : ''}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
              className="text-secondary hover:text-primary hover:bg-card focus-ring flex h-9 w-9 items-center justify-center rounded-xl"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-primary text-sm font-bold capitalize">
              {format(visibleMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
              className="text-secondary hover:text-primary hover:bg-card focus-ring flex h-9 w-9 items-center justify-center rounded-xl"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((day, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="text-muted py-1 text-[11px] font-medium"
              >
                {day}
              </span>
            ))}
            {monthGrid(visibleMonth).map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const selected = key === value;
              const isToday = key === today;
              const outside = !isSameMonth(day, visibleMonth);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={format(day, "EEEE d 'de' MMMM yyyy", {
                    locale: es,
                  })}
                  onClick={() => pick(key)}
                  className={`focus-ring h-9 rounded-xl text-[13px] tabular-nums transition-colors ${
                    selected
                      ? 'bg-accent text-on-accent font-bold'
                      : isToday
                        ? 'text-accent ring-accent hover:bg-card font-bold ring-1 ring-inset'
                        : outside
                          ? 'text-muted hover:bg-card opacity-50'
                          : 'text-primary hover:bg-card'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
