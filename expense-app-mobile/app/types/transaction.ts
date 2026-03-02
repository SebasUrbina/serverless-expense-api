export type Transaction = {
  id: number;
  title: string;
  amount: number;
  category: string;
  type: string; // 'expense' | 'income'
  date: string;
  account: string;
  tag: string | null;
};