'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, X } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';

type MonthSelectorProps = {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string;
};

export function MonthSelector({ value, onChange, className = '' }: MonthSelectorProps) {
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

  // Generate last 12 months for quick selection
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, 'yyyy-MM');
  });

  const displayValue = value ? format(parseISO(`${value}-01`), 'MMM yyyy') : 'All Time';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all h-[42px] min-w-[140px]"
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-zinc-500" />
            <span className="font-medium whitespace-nowrap">{displayValue}</span>
          </div>
          <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {value && (
          <button 
            onClick={() => onChange('')}
            className="flex items-center justify-center h-[42px] w-[42px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 rounded-xl text-zinc-500 hover:text-white transition-colors shrink-0"
            title="Clear filter"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 lg:left-0 lg:right-auto w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-xl p-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 mb-1">
            Quick Select
          </div>
          <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                !value 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              All Time
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
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                {format(parseISO(`${monthStr}-01`), 'MMMM yyyy')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
