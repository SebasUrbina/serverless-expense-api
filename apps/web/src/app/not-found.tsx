import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg-base)' }}>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <FileQuestion size={36} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Página no encontrada
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
