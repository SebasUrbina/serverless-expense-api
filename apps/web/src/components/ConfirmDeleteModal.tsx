'use client';

import { useId, useRef } from 'react';
import { useDialog } from '@/hooks/useDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
};

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();
  useDialog(isOpen, onClose, ref);

  if (!isOpen) return null;

  return (
    // Rendered inside other modals: keep clicks from reaching their backdrop.
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--backdrop-bg)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className="bg-card border-border shadow-elevated w-full max-w-sm rounded-3xl border p-6 focus:outline-none"
      >
        <h2 id={titleId} className="text-primary text-lg font-bold">
          {title}
        </h2>
        <p id={messageId} className="text-secondary mt-2 text-sm">
          {message}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-inset hover:bg-card-hover text-primary focus-ring min-h-11 flex-1 rounded-xl px-4 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="focus-ring min-h-11 flex-1 rounded-xl bg-red-600 px-4 font-semibold text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
