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
      className="rounded-3xl overflow-hidden transition-all duration-200"
      style={{
        background: isOpen ? accentBg : 'var(--bg-card)',
        border: `1px solid ${isOpen ? accentBorder : 'var(--border)'}`,
        boxShadow: isOpen ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 px-4 py-4 transition-all duration-200 text-left"
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 ${iconBg} ${isOpen ? 'scale-105' : ''}`}>
          <Icon size={17} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
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
        <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className="rounded-[1.35rem] px-4 pb-5 pt-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}