'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/store/useTheme';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme() === 'dark';

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Oscuro' },
  ];

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="bg-inset text-secondary border-border flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:scale-110 active:scale-95"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <div className="bg-inset border-border flex gap-0.5 rounded-xl border p-1">
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            type="button"
            key={value}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted hover:text-secondary bg-transparent'
            }`}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
