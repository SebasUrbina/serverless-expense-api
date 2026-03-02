import {
  View, Text, FlatList, ActivityIndicator,
  RefreshControl, Alert, TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../../lib/api";
import { RecurringRuleCard, RecurringRule } from "../../components/recurring/RecurringRuleCard";
import { RecurringModal } from "../../components/recurring/RecurringModal";

export default function Recurring() {
  const api         = useApi();
  const queryClient = useQueryClient();

  const [editingRule, setEditingRule] = useState<RecurringRule | null | "new">(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["recurring"] });

  // ── Fetch rules ──
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["recurring"],
    queryFn: async () => {
      const res = await api.get("/recurring");
      return res.data.rules as RecurringRule[];
    },
  });

  const rules = data ?? [];
  const activeCount   = rules.filter((r) => r.is_active === 1).length;
  const monthlyTotal  = rules
    .filter((r) => r.is_active === 1 && r.type === "expense" && r.frequency === "monthly")
    .reduce((sum, r) => sum + r.amount, 0);

  // ── Create ──
  const createMutation = useMutation({
    mutationFn: (body: Partial<RecurringRule>) => api.post("/recurring", body),
    onSuccess: () => { setEditingRule(null); invalidate(); },
    onError: () => Alert.alert("Error", "Could not create rule."),
  });

  // ── Update ──
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<RecurringRule> }) =>
      api.put(`/recurring/${id}`, updates),
    onSuccess: () => { setEditingRule(null); invalidate(); },
    onError: () => Alert.alert("Error", "Could not update rule."),
  });

  // ── Toggle active/paused ──
  const toggleMutation = useMutation({
    mutationFn: (rule: RecurringRule) =>
      api.put(`/recurring/${rule.id}`, { is_active: rule.is_active === 1 ? 0 : 1 }),
    onSuccess: invalidate,
  });

  // ── Delete ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/recurring/${id}`),
    onSuccess: invalidate,
    onError: () => Alert.alert("Error", "Could not delete rule."),
  });

  const handleDelete = (id: number) =>
    Alert.alert("Delete Rule", "This won't undo already-created transactions.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <GestureHandlerRootView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-16 pb-4 bg-black">
        <View className="flex-row items-end justify-between mb-4">
          <View>
            <Text className="text-3xl text-white font-extrabold tracking-tight">Recurring</Text>
            <Text className="text-[#636366] font-medium">Auto-generated transactions</Text>
          </View>
          {/* FAB-style add button */}
          <TouchableOpacity
            onPress={() => setEditingRule("new")}
            className="w-10 h-10 rounded-full bg-[#0A84FF] items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Summary pills */}
        {rules.length > 0 && (
          <View className="flex-row gap-3">
            <View className="flex-1 bg-[#1C1C1E] rounded-2xl p-3 border border-[#2C2C2E]">
              <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-0.5">Active</Text>
              <Text className="text-white font-bold text-lg">{activeCount}</Text>
            </View>
            <View className="flex-1 bg-[#1C1C1E] rounded-2xl p-3 border border-[#2C2C2E]">
              <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-0.5">Monthly</Text>
              <Text className="text-white font-bold text-lg">
                ${monthlyTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34d399" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#FF3B30] font-medium">Failed to load rules</Text>
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r.id.toString()}
          renderItem={({ item }) => (
            <RecurringRuleCard
              rule={item}
              onEdit={setEditingRule}
              onToggle={(r) => toggleMutation.mutate(r)}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#34d399" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-24">
              <View className="w-16 h-16 rounded-full bg-[#1C1C1E] items-center justify-center mb-4">
                <Ionicons name="repeat" size={28} color="#636366" />
              </View>
              <Text className="text-white font-semibold text-lg mb-1">No recurring rules yet</Text>
              <Text className="text-[#636366] text-sm text-center px-8">
                Tap + to set up a rule and never miss a recurring transaction.
              </Text>
            </View>
          }
        />
      )}

      <RecurringModal
        rule={editingRule === "new" ? null : editingRule}
        visible={editingRule !== null}
        onClose={() => setEditingRule(null)}
        onSave={(data) => {
          if (editingRule === "new") {
            createMutation.mutate(data);
          } else if (editingRule) {
            updateMutation.mutate({ id: editingRule.id, updates: data });
          }
        }}
        isSaving={isSaving}
      />
    </GestureHandlerRootView>
  );
}
