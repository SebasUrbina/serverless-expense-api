'use client';

import { X, AlertTriangle } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl transition-all p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 -mt-2 bg-transparent rounded-full text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-muted text-sm mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-inset hover:bg-card-hover text-primary font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
