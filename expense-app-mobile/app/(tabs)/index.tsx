import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "react-native-gifted-charts";
import { useApi } from "../../lib/api";
import { TransactionItem } from "./transactions";

export default function Dashboard() {
  const api = useApi();

  const { data: transactions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["transactions", "dashboard"],
    queryFn: async () => {
      const response = await api.get("/transactions?limit=100");
      return response.data.transactions;
    },
  });

  // Calculate totals
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  const currentMonthExpenses = safeTransactions.reduce((acc: number, item: any) => {
    return item.type === "expense" ? acc + item.amount : acc;
  }, 0);

  // Transform data for chart
  const categoryTotals: Record<string, number> = {};
  safeTransactions.forEach((item: any) => {
    if (item.type === "expense") {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    }
  });

  const chartData = Object.entries(categoryTotals).map(([label, value]) => ({
    value,
    label: label.substring(0, 3), // Short label
    frontColor: "#34d399", // Emerald 400
  }));

  const recentTransactions = safeTransactions.slice(0, 5);

  return (
    <ScrollView 
      className="flex-1 bg-slate-900 px-4 pt-10"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#34d399" />}
    >
      <View className="mb-8 mt-4 items-center">
        <Text className="text-slate-400 font-medium mb-1 tracking-wider uppercase text-xs">Total Spent This Month</Text>
        <Text className="text-5xl font-extrabold text-white">
          ${currentMonthExpenses.toFixed(2)}
        </Text>
      </View>

      <View className="bg-slate-800 p-5 rounded-3xl mb-8 border border-slate-700 shadow-xl shadow-black/40">
        <Text className="text-white font-bold mb-6 text-lg">Spending by Category</Text>
        {chartData.length > 0 ? (
          <View className="items-center">
             <BarChart
                data={chartData}
                barWidth={35}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: "#64748b" }}
                noOfSections={3}
                labelWidth={40}
                xAxisLabelTextStyle={{ color: "#94a3b8", textAlign: 'center' }}
                height={160}
              />
          </View>
        ) : (
          <Text className="text-slate-500 text-center py-10">No spending data yet</Text>
        )}
      </View>

      <View className="mb-20">
        <Text className="text-white font-bold text-xl mb-4">Recent Transactions</Text>
        {recentTransactions.map((item: any) => (
          <TransactionItem key={item.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}
