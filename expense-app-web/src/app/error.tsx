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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg-base)' }}>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <AlertTriangle size={36} className="text-red-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Algo salió mal
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
      >
        <RotateCcw size={16} />
        Reintentar
      </button>
    </div>
  );
}
