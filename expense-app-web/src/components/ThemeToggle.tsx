'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, applyTheme } from '@/store/useTheme';
import { useEffect, useState } from 'react';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  ];

  if (!mounted) {
    if (compact) {
      return (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all opacity-50"
          style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border)',
          }}
        />
      );
    }
    
    return (
      <div
        className="flex rounded-xl p-1 gap-0.5"
        style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }}
      >
        {options.map(({ value, icon: Icon, label }) => (
          <div
            key={value}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold opacity-0"
            style={{ padding: '0.375rem 0.75rem' }}
          >
            <Icon size={13} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: 'var(--bg-inset)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }



  return (
    <div
      className="flex rounded-xl p-1 gap-0.5"
      style={{
        background: 'var(--bg-inset)',
        border: '1px solid var(--border)',
      }}
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={
              isActive
                ? {
                    background: isDark ? '#2d3142' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#111827',
                    boxShadow: isDark
                      ? '0 1px 4px rgba(0,0,0,0.5)'
                      : '0 1px 3px rgba(0,0,0,0.12)',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text-muted)',
                  }
            }
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
