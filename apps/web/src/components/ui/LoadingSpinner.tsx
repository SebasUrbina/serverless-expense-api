'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'emerald' | 'muted' | 'white';
  className?: string;
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const colorClasses = {
  accent: 'text-accent',
  emerald: 'text-emerald-500',
  muted: 'text-muted',
  white: 'text-white',
};

export function LoadingSpinner({
  size = 'md',
  color = 'accent',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
}

type LoadingStateProps = {
  minHeight?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'emerald' | 'muted' | 'white';
  className?: string;
};

export function LoadingState({
  minHeight = 'h-48',
  text,
  size = 'md',
  color = 'accent',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${minHeight} px-4 py-8 ${className}`}
    >
      <LoadingSpinner size={size} color={color} />
      {text && <p className="text-muted mt-3 text-xs font-medium">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
