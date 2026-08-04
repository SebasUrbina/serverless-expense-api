'use client';

import type { ReactNode, ElementType } from 'react';
import { ChevronDown } from 'lucide-react';

type SettingsAccordionSectionProps = {
  title: string;
  subtitle: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  accentBg: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function SettingsAccordionSection({
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  accentBorder,
  accentBg,
  isOpen,
  onToggle,
  children,
}: SettingsAccordionSectionProps) {
  return (
    <div
      className="overflow-hidden rounded-3xl transition-all duration-200"
      style={{
        background: isOpen ? accentBg : 'var(--bg-card)',
        border: `1px solid ${isOpen ? accentBorder : 'var(--border)'}`,
        boxShadow: isOpen ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
      }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-all duration-200"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 ${iconBg} ${isOpen ? 'scale-105' : ''}`}
        >
          <Icon size={17} className={iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </p>
          <p
            className="truncate text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        </div>
        <ChevronDown
          size={16}
          style={{ color: 'var(--text-muted)' }}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 px-3 pt-0 pb-3 duration-200">
          <div
            className="rounded-[1.35rem] px-4 pt-4 pb-5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
