import { create } from 'zustand';
import type { Transaction } from '@/types/api';

interface TransactionModalState {
  isOpen: boolean;
  initialData: Transaction | null;
  openModal: (data?: Transaction) => void;
  closeModal: () => void;
}

export const useTransactionModal = create<TransactionModalState>((set) => ({
  isOpen: false,
  initialData: null,
  openModal: (data) => set({ isOpen: true, initialData: data || null }),
  closeModal: () => set({ isOpen: false, initialData: null }),
}));
