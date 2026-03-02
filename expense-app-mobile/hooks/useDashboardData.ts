import { useQuery } from "@tanstack/react-query";
import { useApi } from "../lib/api";
import { buildCategoryMeta } from "../constants/Categories";
import { Transaction } from "../app/types/transaction";

export function useDashboardData(currentDate: Date, budget: number, selectedCategory: string | null) {
  const api = useApi();

  // ── Date boundaries ──
  const getYYYYMMDD = (date: Date) => date.toISOString().split("T")[0];
  
  // First day of selected month
  const startDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDateStr = getYYYYMMDD(startDateObj);
  
  // Last day of selected month
  const endDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const endDateStr = getYYYYMMDD(endDateObj);

  // ── Fetch transactions for exactly this month ──
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["transactions", "dashboard", startDateStr, endDateStr],
    queryFn: async () => {
      const response = await api.get(`/transactions?limit=100&startDate=${startDateStr}&endDate=${endDateStr}`);
      return Array.isArray(response.data.transactions) ? response.data.transactions : [];
    },
  });

  const transactions: Transaction[] = data || [];

  // ── Compute category totals ──
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((item: Transaction) => {
    if (item.type === "expense") {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    }
  });

  // ── Palette Generation ──
  const uniqueCategories = Object.keys(categoryTotals);
  const { colorMap, iconMap } = buildCategoryMeta(uniqueCategories);

  // ── Global Math ──
  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, budget - totalSpent);
  const spentPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;

  // ── Pie Data Formatting ──
  const pieData = Object.entries(categoryTotals).map(([cat, value]) => ({
    value,
    color: colorMap[cat] || "#8E8E93",
    text: cat,
  }));
  if (pieData.length === 0) {
    pieData.push({ value: 1, color: "#38383A", text: "" }); // Blank placeholder ring
  }

  const legendEntries = Object.entries(categoryTotals);

  // ── Recent/Filtered Expenses ──
  const expensesOnly = transactions.filter((t: Transaction) => t.type === "expense");
  const filteredExpenses = selectedCategory
    ? expensesOnly.filter((t: Transaction) => t.category === selectedCategory)
    : expensesOnly;
  const recentExpenses = filteredExpenses.slice(0, 5);

  return {
    isLoading,
    isRefetching,
    refetch,
    totalSpent,
    remaining,
    spentPercent,
    pieData,
    legendEntries,
    recentExpenses,
    colorMap,
    iconMap
  };
}
