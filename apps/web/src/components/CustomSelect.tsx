'use client';

import { ChevronDown } from 'lucide-react';

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
  id?: string;
  name?: string;
  ariaLabel?: string;
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  disabled = false,
  size = 'default',
  id,
  name,
  ariaLabel,
}: Props) {
  const selectedValue = String(value);

  return (
    <div className="relative w-full">
      <select
        id={id}
        name={name}
        value={selectedValue}
        disabled={disabled}
        aria-label={ariaLabel ?? (id ? undefined : placeholder)}
        onChange={(event) => {
          const selected = options.find(
            (option) => String(option.value) === event.target.value,
          );
          if (selected) onChange(selected.value);
        }}
        className={`bg-card border-border text-primary focus:border-secondary focus:ring-secondary/25 w-full appearance-none rounded-xl border pr-10 text-sm font-medium transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          size === 'small' ? 'h-[42px] px-3' : 'px-4 py-3'
        } ${selectedValue === '' ? 'text-secondary' : ''}`}
      >
        <option value="" disabled>
          {options.length === 0 ? 'Sin opciones' : placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={16}
        className="text-secondary pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
      />
    </div>
  );
}
