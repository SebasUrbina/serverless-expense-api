import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const fieldClass =
  'bg-card border-border text-primary placeholder:text-muted focus:border-secondary h-11 w-full min-w-0 rounded-xl border px-3.5 text-base transition-colors focus:outline-none sm:text-sm';

export const primaryButtonClass =
  'bg-accent text-on-accent hover:bg-accent-hover focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'bg-card border-border text-primary hover:bg-inset focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function PrimaryButton({
  loading,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${primaryButtonClass} ${className}`}
    >
      {loading ? <LoadingSpinner size="sm" color="current" /> : children}
    </button>
  );
}

/** Square ghost button for row actions; `label` is required for screen readers. */
export function IconButton({
  label,
  tone = 'neutral',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`focus-ring text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        tone === 'danger'
          ? 'hover:text-expense hover:bg-red-500/10'
          : 'hover:text-primary hover:bg-inset'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Bordered list whose rows are separated by dividers. */
export function SettingsList({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <ul
      aria-label={label}
      className="border-border divide-border divide-y overflow-hidden rounded-2xl border"
    >
      {children}
    </ul>
  );
}

export function SettingsListEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="border-border text-secondary rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
      {children}
    </p>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`bg-inset flex h-11 gap-0.5 rounded-xl p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`focus-ring flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${
              active
                ? 'bg-card text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-secondary mb-1.5 block text-[13px] font-medium"
    >
      {children}
    </label>
  );
}
