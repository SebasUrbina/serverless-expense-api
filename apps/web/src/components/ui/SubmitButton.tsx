import React from 'react';

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  text: string;
};

/** Desktop submit button; on mobile the modal header has "Guardar". */
export function SubmitButton({
  loading,
  text,
  className = '',
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`bg-accent focus-ring text-on-accent hover:bg-accent-hover mt-6 hidden min-h-12 w-full items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex ${className}`}
      {...props}
    >
      {loading ? (
        <span
          role="status"
          aria-label="Guardando"
          className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      ) : (
        text
      )}
    </button>
  );
}
