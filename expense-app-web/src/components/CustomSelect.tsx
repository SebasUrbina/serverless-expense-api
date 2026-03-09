'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type Option = {
  value: string | number;
  label: string;
};

type Props = {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
};

export function CustomSelect({ value, onChange, options, placeholder = 'Select an option', disabled = false }: Props) {
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
        className={`w-full flex items-center justify-between bg-zinc-900 border ${
          isOpen ? 'border-zinc-500 ring-1 ring-zinc-500' : 'border-zinc-800 hover:border-zinc-700'
        } rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-500">No options available</div>
          ) : (
            <div className="py-1 relative">
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
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isSelected 
                        ? 'bg-zinc-800 text-white font-medium' 
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    {option.label}
                    {isSelected && <Check size={16} className="text-emerald-500" />}
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
