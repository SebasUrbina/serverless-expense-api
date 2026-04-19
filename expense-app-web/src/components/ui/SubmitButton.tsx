import React from 'react';

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  text: string;
  variant?: 'emerald' | 'red' | 'income' | 'expense';
};

export function SubmitButton({
  loading,
  text,
  variant = 'emerald',
  className = '',
  disabled,
  ...props
}: SubmitButtonProps) {
  const baseClasses = "hidden sm:flex w-full py-4 rounded-xl font-bold items-center justify-center transition-colors mt-6";
  
  const isRed = variant === 'expense' || variant === 'red';
  const variantClasses = isRed 
    ? "bg-red-500 hover:bg-red-400 text-white disabled:bg-red-500/50 disabled:cursor-not-allowed"
    : "bg-emerald-500 hover:bg-emerald-400 text-white disabled:bg-emerald-500/50 disabled:cursor-not-allowed";

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white/80 border-r-2 border-r-white/20"></div>
      ) : (
        text
      )}
    </button>
  );
}
