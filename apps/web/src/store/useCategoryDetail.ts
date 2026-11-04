import { create } from 'zustand';

type CategoryDetailState = {
  categoryId: number | null;
  month: string;
  open: (categoryId: number, month: string) => void;
  close: () => void;
};

export const useCategoryDetail = create<CategoryDetailState>((set) => ({
  categoryId: null,
  month: '',
  open: (categoryId, month) => set({ categoryId, month }),
  close: () => set({ categoryId: null }),
}));
