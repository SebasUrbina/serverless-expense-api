import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../lib/api";

type Transaction = {
  id: number;
  title: string;
  amount: number;
  category: string;
  type: string; // 'expense' | 'income'
  date: string;
  account: string;
  tag: string | null;
};

export function TransactionItem({ item }: { item: Transaction }) {
  const isExpense = item.type === "expense";
  
  return (
    <View className="flex-row flex-wrap items-center justify-between bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-700">
      <View className="flex-row items-center flex-1 min-w-[60%]">
        <View className="w-12 h-12 rounded-full items-center justify-center bg-slate-900 border border-slate-700 mr-4">
          <Text className="text-xl">
            {item.category === "Food" ? "🍔" : item.category === "Transport" ? "🚗" : "🛒"}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.title}</Text>
          <Text className="text-slate-400 text-sm">{item.date}</Text>
        </View>
      </View>
      <View className="items-end min-w-[30%]">
        <Text className={`font-bold text-lg ${isExpense ? 'text-white' : 'text-emerald-400'}`}>
          {isExpense ? '-' : '+'}${item.amount.toFixed(2)}
        </Text>
        <View className="flex-row mt-1 gap-1">
          <Text className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            {item.account}
          </Text>
          {item.tag && (
            <Text className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">
              {item.tag}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Transactions() {
  const api = useApi();

  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    isRefetching, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/transactions?limit=20&page=${pageParam}`);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allTransactions = data ? data.pages.flatMap((page) => page.transactions) : [];

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-10">
      <View className="mb-6">
        <Text className="text-3xl text-white font-extrabold">All Transactions</Text>
        <Text className="text-slate-400">Your complete history</Text>
      </View>

      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34d399" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-400">Failed to load transactions</Text>
        </View>
      ) : (
        <FlatList
          data={allTransactions as Transaction[]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TransactionItem item={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#34d399" className="mt-4 mb-8" />
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-slate-500 text-lg">No transactions found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor="#34d399" />
          }
        />
      )}
    </View>
  );
}

