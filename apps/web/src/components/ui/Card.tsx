import type { ReactNode } from 'react';
import Link from 'next/link';

export function Card({
  label,
  tone = 'default',
  className = '',
  children,
}: {
  /** Accessible name for the section landmark. */
  label?: string;
  /** `hero` paints the card in the brand color; use once per screen. */
  tone?: 'default' | 'hero';
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={`bg-card border-border min-w-0 rounded-3xl border p-5 shadow-sm sm:p-6 ${tone === 'hero' ? 'tone-hero' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  link,
}: {
  title: string;
  description?: ReactNode;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-primary text-base font-bold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-secondary mt-0.5 text-[13px]">{description}</p>
        )}
      </div>
      {link && <CardLink href={link.href}>{link.label}</CardLink>}
    </div>
  );
}

export function CardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-secondary hover:text-primary focus-ring -my-1 shrink-0 rounded-md py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors"
    >
      {children} →
    </Link>
  );
}

/** Label/value pair; render inside a `<dl>`. */
export function CardStat({
  label,
  detail,
  className = '',
  children,
}: {
  label: string;
  detail?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-secondary truncate text-[13px]">{label}</dt>
      <dd
        className={`mt-0.5 truncate text-[15px] font-semibold tabular-nums sm:text-lg ${className || 'text-primary'}`}
      >
        {children}
      </dd>
      {detail && <dd className="text-muted mt-0.5 text-xs">{detail}</dd>}
    </div>
  );
}

/** Inset message for empty or informational states inside a card. */
export function CardNotice({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={`bg-inset rounded-2xl p-5 ${className}`}>
      <p className="text-primary text-[15px] font-semibold">{title}</p>
      {description && (
        <p className="text-secondary mt-1 text-sm">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="bg-primary text-card focus-ring mt-3 min-h-11 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
