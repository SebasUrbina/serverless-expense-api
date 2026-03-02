import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Transaction } from "../../app/types/transaction";
import { TransactionItem } from "../transactions/TransactionItem";

interface RecentExpensesProps {
  recentExpenses: Transaction[];
  selectedCategory: string | null;
  onEdit: (item: Transaction) => void;
  onDelete: (id: number) => void;
}

export function RecentExpenses({ recentExpenses, selectedCategory, onEdit, onDelete }: RecentExpensesProps) {
  const router = useRouter();

  return (
    <View className="mt-8 px-4">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-xl font-bold text-white">
          {selectedCategory ? `${selectedCategory} Expenses` : "Recent Expenses"}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
          <Text className="text-sm font-medium text-[#0A84FF]">See All</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-[#2C2C2E]">
        {recentExpenses.length > 0 ? (
          recentExpenses.map((item: Transaction, idx: number) => {
            const isLast = idx === recentExpenses.length - 1;
            return (
              <View key={item.id}>
                <TransactionItem 
                  item={item} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  variant="compact" 
                />
                {!isLast && <View className="h-[0.5px] bg-[#2C2C2E] ml-[68px]" />}
              </View>
            );
          })
        ) : (
          <View className="py-10 items-center">
            <Text className="text-[#636366] font-medium">No expenses found</Text>
          </View>
        )}
      </View>
    </View>
  );
}
