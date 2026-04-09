'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type MonthSelectorProps = {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string;
  alignDropdown?: 'left' | 'right';
};

export function MonthSelector({ value, onChange, className = '', alignDropdown = 'right' }: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    const currentDate = value ? parseISO(`${value}-01`) : new Date();
    const prevDate = subMonths(currentDate, 1);
    onChange(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const currentDate = value ? parseISO(`${value}-01`) : new Date();
    const nextDate = addMonths(currentDate, 1);
    onChange(format(nextDate, 'yyyy-MM'));
  };

  // Generate last 12 months for quick selection
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, 'yyyy-MM');
  });

  const displayValue = value ? format(parseISO(`${value}-01`), 'MMM yyyy', { locale: es }) : 'Todos';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="flex items-center rounded-xl p-0.5 h-[42px] transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <button 
          onClick={handlePrevMonth}
          className="flex items-center justify-center h-full w-9 rounded-lg hover:bg-(--bg-inset) transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center justify-center gap-2 px-3 h-full text-sm font-medium hover:bg-(--bg-inset) rounded-lg transition-colors min-w-[110px]"
          style={{ color: 'var(--text-primary)' }}
        >
          <Calendar size={14} className="text-emerald-500" />
          <span className="whitespace-nowrap capitalize">{displayValue}</span>
        </button>

        <button 
          onClick={handleNextMonth}
          className="flex items-center justify-center h-full w-9 rounded-lg hover:bg-(--bg-inset) transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isOpen && (
        <div 
          className={`absolute top-full mt-2 w-56 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 overflow-hidden p-2 ${
            alignDropdown === 'left' ? 'left-0' : 'right-0'
          }`}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 mb-1" style={{ color: 'var(--text-muted)' }}>
            Selección rápida
          </div>
          <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                !value 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'hover:bg-(--bg-inset)'
              }`}
              style={{ color: !value ? '' : 'var(--text-primary)' }}
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
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  value === monthStr 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'hover:bg-(--bg-inset)'
                }`}
                style={{ color: value === monthStr ? '' : 'var(--text-primary)' }}
              >
                {format(parseISO(`${monthStr}-01`), 'MMMM yyyy', { locale: es })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
