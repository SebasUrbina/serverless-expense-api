'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, applyTheme } from '@/store/useTheme';
import { useEffect } from 'react';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Apply theme on mount and react to system changes
  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const isDark = resolvedTheme() === 'dark';

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Oscuro' },
    { value: 'system' as const, icon: Monitor, label: 'Auto' },
  ];

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="bg-inset text-secondary hover:text-primary border-border focus-ring flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Tema"
      className="bg-inset border-border flex gap-0.5 rounded-xl border p-1"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            type="button"
            key={value}
            onClick={() => setTheme(value)}
            className={`focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted hover:text-secondary bg-transparent'
            }`}
            aria-pressed={isActive}
          >
            <Icon size={13} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
