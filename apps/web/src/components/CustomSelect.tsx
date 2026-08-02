'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type Option = {
  value: string | number;
  label: string;
};

type Props = {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'default' | 'small';
};

export function CustomSelect({ value, onChange, options, placeholder = 'Select an option', disabled = false, size = 'default' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          size === 'small' ? 'px-3 h-[42px]' : 'px-4 py-3'
        } ${isOpen ? '' : 'hover:bg-(--bg-inset)'}`}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${isOpen ? 'var(--text-secondary)' : 'var(--border)'}`,
          boxShadow: isOpen ? '0 0 0 1px var(--text-secondary)' : 'none'
        }}
      >
        <span 
          className="flex-1 min-w-0 truncate pr-2 text-sm text-left font-medium transition-colors"
          style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {isOpen && !disabled && (
        <div 
          className="absolute z-50 w-full min-w-[140px] mt-2 left-0 sm:right-auto rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto p-1.5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sin opciones</div>
          ) : (
            <div className="flex flex-col gap-0.5 relative">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isSelected 
                        ? 'bg-emerald-500/10 text-emerald-500 font-medium' 
                        : 'font-medium hover:bg-(--bg-inset)'
                    }`}
                    style={{ color: isSelected ? '' : 'var(--text-primary)' }}
                  >
                    <span className="truncate text-left flex-1 pr-2">{option.label}</span>
                    {isSelected && <Check size={16} className="shrink-0 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
