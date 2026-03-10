import { create } from 'zustand';
import { RecurringRule } from '@/app/recurring/page';

interface RecurringModalState {
  isOpen: boolean;
  initialData: RecurringRule | null;
  openModal: (data?: RecurringRule) => void;
  closeModal: () => void;
}

export const useRecurringModal = create<RecurringModalState>((set) => ({
  isOpen: false,
  initialData: null,
  openModal: (data) => set({ isOpen: true, initialData: data || null }),
  closeModal: () => set({ isOpen: false, initialData: null }),
}));
