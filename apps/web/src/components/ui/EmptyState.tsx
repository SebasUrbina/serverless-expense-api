import React from 'react';

type EmptyStateProps = {
  icon: React.ReactNode;
  secondaryIcon?: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  primaryColor?: 'emerald' | 'violet' | 'blue' | 'zinc' | 'red';
  className?: string;
};

export function EmptyState({
  icon,
  secondaryIcon,
  title,
  description,
  actionButton,
  primaryColor = 'emerald',
  className = '',
}: EmptyStateProps) {
  const colors = {
    emerald: {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500',
      softBg: 'var(--emerald-soft)',
      shadow: 'shadow-emerald-500/30',
    },
    violet: {
      text: 'text-violet-500',
      bg: 'bg-violet-500',
      softBg: 'rgba(139, 92, 246, 0.1)',
      shadow: 'shadow-violet-500/30',
    },
    blue: {
      text: 'text-blue-500',
      bg: 'bg-blue-500',
      softBg: 'rgba(59, 130, 246, 0.1)',
      shadow: 'shadow-blue-500/30',
    },
    zinc: {
      text: 'text-zinc-500',
      bg: 'bg-zinc-500',
      softBg: 'var(--bg-inset)',
      shadow: 'shadow-zinc-500/30',
    },
    red: {
      text: 'text-red-500',
      bg: 'bg-red-500',
      softBg: 'var(--red-soft)',
      shadow: 'shadow-red-500/30',
    },
  };

  const theme = colors[primaryColor];

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24 ${className}`}
    >
      {/* Animated icon */}
      <div className="relative mb-6">
        <div
          className={`recurring-fade-up flex h-20 w-20 items-center justify-center rounded-3xl ${theme.text}`}
          style={{ background: theme.softBg }}
        >
          {icon}
        </div>
        {secondaryIcon && (
          <div
            className={`recurring-fade-up absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-lg ${theme.bg} ${theme.shadow}`}
            style={{ animationDelay: '200ms' }}
          >
            {secondaryIcon}
          </div>
        )}
      </div>

      <h3
        className="recurring-fade-up mb-2 text-xl font-bold sm:text-2xl"
        style={{ color: 'var(--text-primary)', animationDelay: '100ms' }}
      >
        {title}
      </h3>
      <p
        className="recurring-fade-up mb-8 max-w-sm text-sm leading-relaxed sm:text-base"
        style={{ color: 'var(--text-muted)', animationDelay: '200ms' }}
      >
        {description}
      </p>

      {actionButton && (
        <div className="recurring-fade-up" style={{ animationDelay: '300ms' }}>
          {actionButton}
        </div>
      )}
    </div>
  );
}
