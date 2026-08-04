'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <AlertTriangle size={36} className="text-red-400" />
      </div>
      <h1
        className="mb-2 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Algo salió mal
      </h1>
      <p
        className="mb-8 max-w-xs text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-400"
      >
        <RotateCcw size={16} />
        Reintentar
      </button>
    </div>
  );
}
