import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { MonthNavigator } from "../../components/dashboard/MonthNavigator";
import { DonutChartCard } from "../../components/dashboard/DonutChartCard";
import { BudgetCard } from "../../components/dashboard/BudgetCard";
import { RecentActivity } from "../../components/dashboard/RecentActivity";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useApi } from "../../lib/api";
import { EditModal } from "../../components/transactions/EditModal";
import { Transaction } from "../../types/transaction";

// ── Upcoming recurring card ───────────────────────────────────────────────────
function UpcomingRecurring() {
  const api    = useApi();
  const router = useRouter();

  const { data: rules } = useQuery({
    queryKey: ["recurring"],
    queryFn: async () => (await api.get("/recurring")).data.rules,
    staleTime: 60_000,
  });

  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const endOfMonth = `${year}-${month}-28`; // safe cap for all months

  const upcoming = (rules ?? []).filter(
    (r: any) => r.is_active === 1 && r.next_run >= now.toISOString().split("T")[0] && r.next_run <= endOfMonth
  );

  if (upcoming.length === 0) return null;

  const total = upcoming
    .filter((r: any) => r.type === "expense")
    .reduce((sum: number, r: any) => sum + r.amount, 0);

  return (
    <View className="mt-8 px-4">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-xl font-bold text-white">Upcoming This Month</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/recurring")}>
          <Text className="text-sm font-medium text-[#0A84FF]">See All</Text>
        </TouchableOpacity>
      </View>
      <View className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-[#2C2C2E]">
        {upcoming.slice(0, 3).map((r: any, idx: number) => {
          const isLast = idx === Math.min(upcoming.length, 3) - 1;
          return (
            <View key={r.id}>
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg bg-[#BF5AF2]/20 items-center justify-center">
                    <Ionicons name="repeat" size={17} color="#BF5AF2" />
                  </View>
                  <View>
                    <Text className="text-white font-medium text-sm" numberOfLines={1}>{r.title}</Text>
                    <Text className="text-[#636366] text-xs">{r.next_run}</Text>
                  </View>
                </View>
                <Text className="text-white font-semibold text-sm">
                  -${r.amount.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                </Text>
              </View>
              {!isLast && <View className="h-[0.5px] bg-[#38383A] ml-[60px]" />}
            </View>
          );
        })}
        {upcoming.length > 3 && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/recurring")}
            className="px-4 py-3 border-t border-[#2C2C2E] flex-row items-center justify-between"
          >
            <Text className="text-[#8E8E93] text-sm">{upcoming.length - 3} more upcoming</Text>
            <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      <Text className="text-[#636366] text-xs text-right mt-1.5 pr-1">
        Total committed: ${total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
      </Text>
    </View>
  );
}

const BUDGET_KEY = "monthly_budget";


export default function Dashboard() {
  const queryClient = useQueryClient();
  const api = useApi();

  // ── Global State ──
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ── Budget State ──
  const [budget, setBudget] = useState(10000);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(BUDGET_KEY).then((val) => {
      if (val) setBudget(Number(val));
    });
  }, []);

  const saveBudget = useCallback(() => {
    const num = parseFloat(budgetInput);
    if (!isNaN(num) && num > 0) {
      setBudget(num);
      AsyncStorage.setItem(BUDGET_KEY, String(num));
    }
    setShowBudgetModal(false);
  }, [budgetInput]);

  // ── Data Hook ──
  // Reacts automatically to `currentDate` changes
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["recurring"] });
    setRefreshing(false);
  }, [queryClient]);

  const {
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
  } = useDashboardData(currentDate, budget, selectedCategory);

  // ── Edit / Delete Logic ──
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onError: () => Alert.alert("Error", "Could not delete the transaction."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Transaction> }) =>
      api.put(`/transactions/${id}`, updates),
    onSuccess: () => { setEditingItem(null); queryClient.invalidateQueries({ queryKey: ["transactions"] }); },
    onError: () => Alert.alert("Error", "Could not update the transaction."),
  });

  const handleDelete = (id: number) =>
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-black">
        <ScrollView
          className="flex-1 bg-black"
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 64 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#30D158" />}
        >
      <Animated.View entering={FadeInDown.duration(400).springify()}>
        <Text className="px-6 text-3xl font-extrabold text-white tracking-tight">
          Se<Text className="text-[#30D158]">va</Text>
        </Text>
        <Text className="px-6 text-[#8E8E93] text-sm mb-4">¿En que seva mi plata?</Text>
      </Animated.View>

      {/* ── Month Swiper ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(50).springify()}>
        <MonthNavigator currentDate={currentDate} onChangeMonth={setCurrentDate} />
      </Animated.View>

      {isLoading && !isRefetching ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <DashboardSkeleton />
        </Animated.View>
      ) : (
        <>
          {/* ── Extracted Components ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(100).springify()}>
            <DonutChartCard
              pieData={pieData}
              tagPieData={tagPieData}
              barData={barData}
              totalSpent={totalSpent}
              legendEntries={legendEntries}
              tagLegendEntries={tagLegendEntries}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              colorMap={colorMap}
            />
          </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(150).springify()}>
        <BudgetCard
          budget={budget}
          totalSpent={totalSpent}
          totalIncome={totalIncome}
          remaining={remaining}
          spentPercent={spentPercent}
          showBudgetModal={showBudgetModal}
          setShowBudgetModal={setShowBudgetModal}
          budgetInput={budgetInput}
          setBudgetInput={setBudgetInput}
          saveBudget={saveBudget}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(700).delay(200).springify()}>
        <RecentActivity
          recentActivity={recentActivity}
          onEdit={setEditingItem}
          onDelete={handleDelete}
        />
      </Animated.View>

      <UpcomingRecurring />
        </>
      )}
        </ScrollView>

        <EditModal
          item={editingItem}
          visible={editingItem !== null}
          onClose={() => setEditingItem(null)}
          onSave={(updates) => {
            if (editingItem) updateMutation.mutate({ id: editingItem.id, updates });
          }}
          isSaving={updateMutation.isPending}
        />
      </View>
    </GestureHandlerRootView>
  );
}
