import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildCategoryMeta } from "../../constants/Categories";

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  category: string;
  type: string;
  date: string;
  account: string;
  tag: string | null;
};

function getCategoryColor(cat: string): string {
  const { colorMap } = buildCategoryMeta([cat]);
  return colorMap[cat] ?? "#8E8E93";
}
function getCategoryIcon(cat: string): string {
  const { iconMap } = buildCategoryMeta([cat]);
  return iconMap[cat] ?? "pricetag";
}

interface TransactionItemProps {
  item: Transaction;
  onEdit: (item: Transaction) => void;
  onDelete: (id: number) => void;
}

export function TransactionItem({ item, onEdit, onDelete }: TransactionItemProps) {
  const isExpense = item.type === "expense";
  const catColor  = getCategoryColor(item.category);
  const catIcon   = getCategoryIcon(item.category);

  const handleLongPress = () => {
    Alert.alert(item.title, "What would you like to do?", [
      { text: "✏️  Edit", onPress: () => onEdit(item) },
      { text: "🗑  Delete", style: "destructive", onPress: () => onDelete(item.id) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} delayLongPress={400} activeOpacity={0.75}>
      <View className="flex-row items-center bg-[#1C1C1E] px-4 py-3.5 border-b border-[#2C2C2E]">
        {/* Category icon */}
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3 shrink-0"
          style={{ backgroundColor: `${catColor}20` }}
        >
          <Ionicons name={catIcon as any} size={19} color={catColor} />
        </View>

        {/* Title + meta */}
        <View className="flex-1 mr-3">
          <Text className="text-white font-medium text-base" numberOfLines={1}>
            {item.title}
          </Text>
          <View className="flex-row flex-wrap gap-1 mt-1">
            <View className="bg-[#2C2C2E] rounded-full px-2 py-0.5">
              <Text className="text-[#98989D] text-xs font-semibold uppercase tracking-wide" numberOfLines={1}>
                {item.account}
              </Text>
            </View>
            {item.tag && (
              <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <Text className="text-emerald-400 text-xs font-semibold uppercase tracking-wide" numberOfLines={1}>
                  {item.tag}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount */}
        <Text
          className={`font-semibold text-base shrink-0 ${isExpense ? "text-white" : "text-emerald-400"}`}
          numberOfLines={1}
        >
          {isExpense ? "-" : "+"}${item.amount.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
