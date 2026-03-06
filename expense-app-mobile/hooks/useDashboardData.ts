import { useQuery } from "@tanstack/react-query";
import { useApi } from "../lib/api";
import { buildCategoryMeta } from "../constants/Categories";
import { Transaction } from "../types/transaction";

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

  // ── Fetch Monthly Summary ──
  const { data: monthlySummaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["transactions", "summary", "monthly"],
    queryFn: async () => {
      const response = await api.get('/transactions/summary/monthly?months=6');
      return Array.isArray(response.data.summary) ? response.data.summary : [];
    },
  });

  const transactions: Transaction[] = data || [];

  // ── Compute category & tag totals ──
  const categoryTotals: Record<string, number> = {};
  const tagTotals: Record<string, number> = {};

  transactions.forEach((item: Transaction) => {
    if (item.type === "expense") {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
      
      if (item.tag) {
        tagTotals[item.tag] = (tagTotals[item.tag] || 0) + item.amount;
      }
    }
  });

  // ── Palette Generation ──
  const uniqueCategories = Object.keys(categoryTotals);
  const { colorMap, iconMap } = buildCategoryMeta(uniqueCategories);

  // ── Global Math ──
  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, budget - totalSpent);
  const spentPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  
  const totalIncome = transactions
    .filter((t: Transaction) => t.type === "income")
    .reduce((acc, item) => acc + item.amount, 0);

  // ── Pie Data Formatting (Categories) ──
  const pieData = Object.entries(categoryTotals).map(([cat, value]) => ({
    value,
    color: colorMap[cat] || "#8E8E93",
    text: cat,
  }));
  if (pieData.length === 0) {
    pieData.push({ value: 1, color: "#38383A", text: "" }); // Blank placeholder ring
  }
  const legendEntries = Object.entries(categoryTotals);

  // ── Pie Data Formatting (Tags) ──
  // Consistent distinct colors for tags
  const tagColors: Record<string, string> = {
    "Fixed Expense": "#BF5AF2",    // Purple
    "Variable Expense": "#FF9F0A", // Orange
  };
  const tagPieData = Object.entries(tagTotals).map(([tag, value]) => ({
    value,
    color: tagColors[tag] || "#32ADE6", // Fallback blue
    text: tag,
  }));
  if (tagPieData.length === 0) {
    tagPieData.push({ value: 1, color: "#38383A", text: "" }); // Blank placeholder ring
  }
  const tagLegendEntries = Object.entries(tagTotals);

  // ── Bar Data Formatting ──
  // Format the monthly summary data for a Grouped Bar Chart (Income vs Expense).
  // We use flatMap to push two objects per month.
  const barData = (monthlySummaryData || []).flatMap((item: any) => {
    // item.month is "YYYY-MM"
    const [y, m] = item.month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const shortMonth = date.toLocaleString('en-US', { month: 'short' }); 
    return [
      {
        value: item.total_income,
        label: shortMonth, // Used by default in grouped mode
        monthLabel: shortMonth, // Custom fallback for filtering
        frontColor: '#30D158', // Green for income
        spacing: 10, 
      },
      {
        value: item.total_expense,
        monthLabel: shortMonth, // Custom fallback for filtering
        frontColor: '#FF453A', // Red for expense
        spacing: 24, // Space between month groups
      }
    ];
  });

  // ── Recent/Filtered Activity ──
  const filteredActivity = selectedCategory
    ? transactions.filter((t: Transaction) => t.category === selectedCategory)
    : transactions;
  const recentActivity = filteredActivity.slice(0, 5);

  return {
    isLoading,
    isRefetching,
    refetch,
    totalSpent,
    totalIncome,
    remaining,
    spentPercent,
    pieData,
    tagPieData,
    barData,
    legendEntries,
    tagLegendEntries,
    recentActivity,
    colorMap,
    iconMap
  };
}
