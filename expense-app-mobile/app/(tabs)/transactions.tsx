import {
  View, Text, FlatList, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useDeferredValue } from "react";
import { useApi } from "../../lib/api";

import { SearchBar } from "../../components/transactions/SearchBar";
import { TransactionGroup } from "../../components/transactions/TransactionGroup";
import { EditModal } from "../../components/transactions/EditModal";
import { Transaction } from "../../components/transactions/TransactionItem";
import { TransactionSkeleton } from "../../components/transactions/TransactionSkeleton";

// ── Date label helper ─────────────────────────────────────────────────────────
function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

// ── Group into sections array ─────────────────────────────────────────────────
type Section = { title: string; data: Transaction[] };

function groupByDate(transactions: Transaction[]): Section[] {
  const map: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a)) // newest first
    .map(([dateStr, data]) => ({ title: formatDateLabel(dateStr), data }));
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Transactions() {
  const api         = useApi();
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState("");
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const deferredSearch                = useDeferredValue(search);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }, [queryClient]);

  // ── Infinite query — key includes search so it resets on new term ──
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["transactions", "list", deferredSearch],
      queryFn: async ({ pageParam = 1 }) => {
        const params = new URLSearchParams({ limit: "30", page: String(pageParam) });
        if (deferredSearch) params.set("search", deferredSearch);
        const res = await api.get(`/transactions?${params.toString()}`);
        return res.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allTransactions: Transaction[] = data ? data.pages.flatMap((p) => p.transactions) : [];
  // Group into sections — each section is the unit rendered by FlatList
  const sections = groupByDate(allTransactions);

  // ── Mutations ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: invalidateAll,
    onError: () => Alert.alert("Error", "Could not delete the transaction."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Transaction> }) =>
      api.put(`/transactions/${id}`, updates),
    onSuccess: () => { setEditingItem(null); invalidateAll(); },
    onError: () => Alert.alert("Error", "Could not update the transaction."),
  });

  const handleDelete = (id: number) =>
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);

  // ── Render a section group as a single FlatList item ──
  const renderSection = ({ item: section }: { item: Section }) => (
    <TransactionGroup
      title={section.title}
      data={section.data}
      onEdit={setEditingItem}
      onDelete={handleDelete}
    />
  );

  return (
    <View className="flex-1 bg-black">
      {/* Sticky header */}
      <View className="px-4 pt-16 pb-2 bg-black">
        <Text className="text-3xl text-white font-extrabold tracking-tight mb-1">Transactions</Text>
        <Text className="text-[#636366] font-medium mb-4">Your complete history</Text>
        <SearchBar value={search} onChangeText={setSearch} onClear={() => setSearch("")} />
      </View>

      {isLoading && !isRefetching ? (
        <TransactionSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[#FF3B30] font-medium text-center">Failed to load transactions</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(section) => section.title}
          renderItem={renderSection}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#34d399"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-24">
              <Text className="text-[#636366] font-medium text-lg">
                {search ? "No results found" : "No transactions yet"}
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator size="small" color="#636366" className="mt-4 mb-8" />
              : null
          }
        />
      )}

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
  );
}
