'use client';

import Link from 'next/link';
import { WifiOff, RefreshCcw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="bg-base min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <WifiOff className="text-secondary" size={28} aria-hidden="true" />
        <h1 className="text-primary mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          Estás sin conexión
        </h1>
        <p className="text-secondary mt-2 text-sm leading-relaxed sm:text-base">
          Las pantallas que ya abriste siguen disponibles. Cuando vuelva la
          conexión, Seva sincronizará tus datos.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-accent text-on-accent hover:bg-accent-hover focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors"
          >
            <RefreshCcw size={16} aria-hidden="true" />
            Reintentar
          </button>
          <Link
            href="/"
            className="bg-card border-border text-primary hover:bg-inset focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
