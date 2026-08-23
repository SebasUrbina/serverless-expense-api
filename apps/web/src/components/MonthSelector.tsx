'use client';

import { addMonths, format, isValid, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type MonthSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  alignDropdown?: 'left' | 'right';
};

function shiftMonth(value: string, amount: number) {
  const current = value ? parseISO(`${value}-01`) : new Date();
  if (!isValid(current)) return value;
  return format(addMonths(current, amount), 'yyyy-MM');
}

export function MonthSelector({
  value,
  onChange,
  className = '',
}: MonthSelectorProps) {
  const last12Months = Array.from({ length: 12 }, (_, index) =>
    format(subMonths(new Date(), index), 'yyyy-MM'),
  );

  return (
    <div
      className={`bg-inset border-border flex h-10 max-w-full items-center rounded-2xl border p-1 shadow-sm backdrop-blur-xl sm:h-[42px] ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="hover:bg-card-hover text-muted hover:text-secondary flex h-full w-8 items-center justify-center rounded-xl transition-colors sm:w-9"
        aria-label="Mes anterior"
      >
        <ChevronLeft aria-hidden="true" size={16} />
      </button>

      <div className="relative min-w-[108px] flex-1">
        <Calendar
          aria-hidden="true"
          size={14}
          className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-emerald-500"
        />
        <select
          aria-label="Período"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="text-primary h-8 w-full appearance-none bg-transparent pr-2 pl-7 text-center text-xs font-semibold capitalize focus-visible:outline-2 focus-visible:outline-emerald-500 sm:text-sm"
        >
          <option value="">Todos los meses</option>
          {last12Months.map((month) => (
            <option key={month} value={month}>
              {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: es })}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="hover:bg-card-hover text-muted hover:text-secondary flex h-full w-8 items-center justify-center rounded-xl transition-colors sm:w-9"
        aria-label="Mes siguiente"
      >
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
