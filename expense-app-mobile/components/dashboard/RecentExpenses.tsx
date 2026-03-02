import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Transaction } from "../../app/types/transaction";

interface RecentExpensesProps {
  recentExpenses: Transaction[];
  selectedCategory: string | null;
  colorMap: Record<string, string>;
  iconMap: Record<string, string>;
}

export function RecentExpenses({ recentExpenses, selectedCategory, colorMap, iconMap }: RecentExpensesProps) {
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

      <View className="bg-[#1C1C1E] rounded-[20px] overflow-hidden">
        {recentExpenses.length > 0 ? (
          recentExpenses.map((item: Transaction, idx: number) => {
            const catColor = colorMap[item.category] || "#8E8E93";
            const catIconName = iconMap[item.category] || "pricetag";
            const isLast = idx === recentExpenses.length - 1;
            return (
              <View key={item.id}>
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: `${catColor}18` }}
                    >
                      <Ionicons name={catIconName as any} size={22} color={catColor} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-white tracking-tight" numberOfLines={1}>{item.title}</Text>
                      <Text className="text-sm text-[#8E8E93]">{item.date}</Text>
                    </View>
                  </View>
                  <Text className="text-base font-bold text-white tracking-tight">
                    -${item.amount.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                {!isLast && <View className="h-[0.5px] bg-[#38383A] ml-[72px]" />}
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
