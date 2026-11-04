import React from 'react';
import { Trash2 } from 'lucide-react';

type DeleteButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  text?: string;
};

export function DeleteButton({
  text = 'Eliminar',
  className = '',
  disabled,
  ...props
}: DeleteButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`text-expense focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold transition-colors hover:bg-red-500/10 disabled:opacity-50 ${className}`}
      {...props}
    >
      <Trash2 size={18} aria-hidden="true" />
      {text}
    </button>
  );
}
