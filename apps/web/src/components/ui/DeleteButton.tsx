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
  const baseClasses = "w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20";
  // The responsive behavior from recurring: sm:p-0 sm:py-4 sm:bg-transparent sm:hover:bg-red-500/10
  // and from transaction: text-secondary hover:text-red-500 hover:bg-red-500/10
  // Let's use a solid elegant style across both
  const unifiedClasses = "sm:bg-transparent sm:hover:bg-red-500/10 font-bold sm:font-semibold";

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${baseClasses} ${unifiedClasses} ${className}`}
      {...props}
    >
      <Trash2 size={18} />
      {text}
    </button>
  );
}
