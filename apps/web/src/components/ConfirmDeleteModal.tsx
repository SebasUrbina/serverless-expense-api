'use client';

import { X, AlertTriangle } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--backdrop-bg)] p-4 backdrop-blur-sm">
      <div className="bg-card border-border relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl transition-all">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3 text-red-500">
            <div className="rounded-full bg-red-500/10 p-2">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary -mt-2 -mr-2 rounded-full bg-transparent p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-muted mb-8 text-sm leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="bg-inset hover:bg-card-hover text-primary flex-1 rounded-xl px-4 py-3 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
