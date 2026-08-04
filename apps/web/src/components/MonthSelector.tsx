'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO, subMonths, addMonths, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

type MonthSelectorProps = {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string;
  alignDropdown?: 'left' | 'right';
};

export function MonthSelector({
  value,
  onChange,
  className = '',
  alignDropdown = 'right',
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    const currentDate = value ? parseISO(`${value}-01`) : new Date();
    if (!isValid(currentDate)) return;
    const prevDate = subMonths(currentDate, 1);
    onChange(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const currentDate = value ? parseISO(`${value}-01`) : new Date();
    if (!isValid(currentDate)) return;
    const nextDate = addMonths(currentDate, 1);
    onChange(format(nextDate, 'yyyy-MM'));
  };

  // Generate last 12 months for quick selection
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, 'yyyy-MM');
  });

  const displayValue = value
    ? format(parseISO(`${value}-01`), 'MMM yyyy', { locale: es })
    : 'Todos';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="bg-inset border-border flex h-10 max-w-full items-center rounded-2xl border p-1 shadow-sm backdrop-blur-xl transition-all sm:h-[42px]">
        <button
          onClick={handlePrevMonth}
          className="hover:bg-card-hover text-muted hover:text-secondary flex h-full w-8 items-center justify-center rounded-xl transition-colors sm:w-9"
          title="Mes anterior"
        >
          <ChevronLeft size={16} className="sm:h-[18px] sm:w-[18px]" />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hover:bg-card-hover text-primary flex h-full min-w-[88px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors sm:min-w-[110px] sm:px-3 sm:text-sm"
        >
          <Calendar
            size={14}
            className="text-emerald-500 sm:h-[15px] sm:w-[15px] dark:text-emerald-400"
          />
          <span className="tracking-wide whitespace-nowrap capitalize">
            {displayValue}
          </span>
        </button>

        <button
          onClick={handleNextMonth}
          className="hover:bg-card-hover text-muted hover:text-secondary flex h-full w-8 items-center justify-center rounded-xl transition-colors sm:w-9"
          title="Mes siguiente"
        >
          <ChevronRight size={16} className="sm:h-[18px] sm:w-[18px]" />
        </button>
      </div>

      {isOpen && (
        <div
          className={`bg-card/95 border-border shadow-elevated absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-3xl border p-2 backdrop-blur-2xl ${
            alignDropdown === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="text-muted mb-1 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
            Selección rápida
          </div>
          <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                !value
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-secondary hover:bg-inset hover:text-primary'
              }`}
            >
              Todos los meses
            </button>
            {last12Months.map((monthStr) => (
              <button
                key={monthStr}
                onClick={() => {
                  onChange(monthStr);
                  setIsOpen(false);
                }}
                className={`rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  value === monthStr
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-secondary hover:bg-inset hover:text-primary'
                }`}
              >
                {format(parseISO(`${monthStr}-01`), 'MMMM yyyy', {
                  locale: es,
                })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
