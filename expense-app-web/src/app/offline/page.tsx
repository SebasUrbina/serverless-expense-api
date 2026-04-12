'use client';

import Link from 'next/link';
import { WifiOff, RefreshCcw, BarChart3 } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen px-5 py-10 sm:px-8"
      style={{
        background: 'radial-gradient(circle at top, rgba(16,185,129,0.14), transparent 28%), var(--bg-base)',
      }}
    >
      <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.8rem]"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,8,12,0.04))',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <WifiOff className="text-emerald-500" size={34} />
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--text-muted)' }}>
          Sin conexión
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
          Seva sigue contigo, pero ahora mismo estás offline.
        </h1>
        <p className="mb-8 max-w-md text-sm leading-6 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Puedes volver al dashboard cuando recuperes conexión. La app mantendrá disponibles las pantallas que ya quedaron cacheadas.
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-colors"
            style={{ background: '#10b981', boxShadow: '0 12px 24px rgba(16,185,129,0.22)' }}
          >
            <RefreshCcw size={16} />
            Reintentar conexión
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <BarChart3 size={16} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}