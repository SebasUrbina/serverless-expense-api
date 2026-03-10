import { create } from 'zustand';
import { Transaction } from '@/hooks/useDashboardData';

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
