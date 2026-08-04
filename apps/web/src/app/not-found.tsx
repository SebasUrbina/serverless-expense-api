import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
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
        <FileQuestion size={36} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h1
        className="mb-2 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Página no encontrada
      </h1>
      <p
        className="mb-8 max-w-xs text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-400"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
