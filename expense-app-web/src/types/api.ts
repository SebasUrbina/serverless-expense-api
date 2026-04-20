export type TransactionSplit = {
  user_id: string;
  percentage: number;
  amount?: number;
  nickname?: string;
};

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  category_icon?: string;
  type: 'expense' | 'income';
  account_id: number;
  tag_ids?: number[];
  date: string;
  recurring_rule_id?: number;
  is_shared?: number;
  group_id?: number;
  splits?: TransactionSplit[];
  created_at?: string;
  category: string;
  account: string;
  tag_names?: string[];
  group_name?: string;
  my_split_amount?: number;
  my_split_percentage?: number;
  is_owner?: boolean;
};

export type RecurringRule = {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  type: 'expense' | 'income';
  account_id: number;
  tag_ids?: number[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month?: number | null;
  next_run: string;
  end_date?: string | null;
  is_active: number;
  created_at?: string;
  category?: string;
  category_icon?: string;
  account?: string;
};

export type Category = {
  id: number;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  user_id?: string;
  created_at?: string;
};

export type Tag = {
  id: number;
  name: string;
  user_id?: string;
  created_at?: string;
};

export type Account = {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash';
  balance: number;
  user_id?: string;
  created_at?: string;
};

export type GroupBalanceMember = {
  user_id: string;
  nickname: string;
  total_paid: number;
  total_share: number;
  net: number;
};

export type GroupBalance = {
  group_id: number;
  group_name: string;
  month: string;
  transaction_count: number;
  members: GroupBalanceMember[];
};

export type SettlementPair = {
  debtor: string;
  creditor: string;
  amount: number;
};

export type GroupMember = {
  user_id: string;
  nickname: string;
};

export type SharedGroup = {
  id: number;
  name: string;
  invite_code: string | null;
  created_by: string;
  members: GroupMember[];
};

export type UserSetupResponse = {
  setup: boolean;
  message: string;
};

export type MonthlySummary = {
  month: string;
  total_expense: number;
  total_income: number;
};

export type CategorySummary = {
  category: string;
  category_id: number;
  category_icon?: string;
  amount: number;
  previous_amount?: number;
  type: 'expense' | 'income';
};

export type KPISummary = {
  largest_expense: number | null;
  largest_expense_title: string | null;
  largest_income: number | null;
  transaction_count: number;
};

export type TransactionsResponse = {
  transactions: Transaction[];
};

export type RecurringRulesResponse = {
  rules: RecurringRule[];
};

export type MonthlySummaryResponse = {
  summary: MonthlySummary[];
};

export type CategorySummaryResponse = {
  summary: CategorySummary[];
};

export type KpiSummaryResponse = {
  kpis: KPISummary;
};

export type CategoriesResponse = {
  categories: Category[];
};

export type TagsResponse = {
  tags: Tag[];
};

export type AccountsResponse = {
  accounts: Account[];
};

export type GroupsResponse = {
  groups: SharedGroup[];
};

export type GroupBalancesResponse = {
  balances: GroupBalance[];
};

export type ApiKeyResponse = {
  key: string;
};