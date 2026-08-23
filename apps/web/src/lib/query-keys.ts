/**
 * Query keys are part of the cache's public contract. Keeping them here avoids
 * subtle invalidation bugs caused by hand-written strings spread across files.
 */
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: (filters: readonly unknown[]) =>
      ['transactions', 'list', ...filters] as const,
    recent: (month?: string) =>
      ['transactions', 'recent', month ?? 'current'] as const,
    monthlySummary: ['transactions', 'monthlySummary'] as const,
    categorySummary: (month?: string) =>
      ['transactions', 'categorySummary', month ?? 'current'] as const,
    kpiSummary: (month?: string) =>
      ['transactions', 'kpiSummary', month ?? 'current'] as const,
    analytics: {
      monthly: (month: string) =>
        ['transactions', 'analytics', 'monthly', month] as const,
      category: (month: string) =>
        ['transactions', 'analytics', 'category', month] as const,
      categoryTrend: [
        'transactions',
        'analytics',
        'category-trend',
      ] as const,
    },
  },
  preferences: {
    categories: ['categories'] as const,
    tags: ['tags'] as const,
    accounts: ['accounts'] as const,
    groups: ['groups'] as const,
    apiKey: ['api_key'] as const,
  },
  recurring: {
    all: ['recurring'] as const,
    list: ['recurring', 'list'] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    byMonth: (month: string) => ['budgets', month] as const,
  },
  groupBalances: {
    all: ['group-balances'] as const,
    byMonth: (month?: string) =>
      ['group-balances', month ?? 'current'] as const,
  },
} as const;
