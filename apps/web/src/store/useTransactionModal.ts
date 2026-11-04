import { create } from 'zustand';
import type { Transaction } from '@/types/api';

interface TransactionModalState {
  isOpen: boolean;
  /** Movement being edited. */
  initialData: Transaction | null;
  /** Movement copied into a new one ("Repetir hoy"). */
  template: Transaction | null;
  /** Changes on every open so the dialog remounts with fresh state. */
  session: number;
  openModal: (data?: Transaction) => void;
  openRepeat: (template: Transaction) => void;
  closeModal: () => void;
}

export const useTransactionModal = create<TransactionModalState>((set) => ({
  isOpen: false,
  initialData: null,
  template: null,
  session: 0,
  openModal: (data) =>
    set((s) => ({
      isOpen: true,
      initialData: data || null,
      template: null,
      session: s.session + 1,
    })),
  openRepeat: (template) =>
    set((s) => ({
      isOpen: true,
      initialData: null,
      template,
      session: s.session + 1,
    })),
  closeModal: () => set({ isOpen: false, initialData: null, template: null }),
}));
