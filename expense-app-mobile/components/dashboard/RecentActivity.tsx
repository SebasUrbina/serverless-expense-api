import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Transaction } from "../../types/transaction";
import { TransactionItem } from "../transactions/TransactionItem";

interface RecentActivityProps {
  recentActivity: Transaction[];
  onEdit: (item: Transaction) => void;
  onDelete: (id: number) => void;
}

export function RecentActivity({ recentActivity, onEdit, onDelete }: RecentActivityProps) {
  const router = useRouter();

  return (
    <View className="mt-8 px-4">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-xl font-bold text-white">Latest Transactions</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
          <Text className="text-sm font-medium text-[#0A84FF]">See All</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-[#2C2C2E]">
        {recentActivity.length > 0 ? (
          recentActivity.map((item: Transaction, idx: number) => {
            const isLast = idx === recentActivity.length - 1;
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
            <Text className="text-[#636366] font-medium">No activity found</Text>
          </View>
        )}
      </View>
    </View>
  );
}
