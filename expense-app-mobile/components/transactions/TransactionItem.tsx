import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildCategoryMeta } from "../../constants/Categories";
import { Swipeable } from "react-native-gesture-handler";
import { useRef } from "react";

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
  variant?: "default" | "compact";
}

export function TransactionItem({ item, onEdit, onDelete, variant = "default" }: TransactionItemProps) {
  const isExpense = item.type === "expense";
  const catColor  = getCategoryColor(item.category);
  const catIcon   = getCategoryIcon(item.category);
  const swipeableRef = useRef<Swipeable>(null);
  
  const isCompact = variant === "compact";

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(item.id);
        }}
        className="w-20 items-center justify-center bg-[#FF3B30] h-full"
      >
        <Animated.View style={{ transform: [{ scale }] }}>
           <Ionicons name="trash" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable 
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity onPress={() => onEdit(item)} activeOpacity={0.75}>
        <View className="flex-row items-center bg-[#1C1C1E] px-4 py-3.5 border-b border-[#2C2C2E]">
          {/* Category icon */}
          <View
            className={`${isCompact ? "w-11 h-11" : "w-10 h-10"} rounded-xl items-center justify-center mr-3 shrink-0`}
            style={{ backgroundColor: `${catColor}18` }}
          >
            <Ionicons name={catIcon as any} size={isCompact ? 22 : 19} color={catColor} />
          </View>

          {/* Title + meta */}
          <View className="flex-1 mr-3">
            <Text className="text-white font-medium text-base" numberOfLines={1}>
              {item.title}
            </Text>
            {isCompact ? (
              <View className="mt-0.5">
                <Text className="text-sm text-[#8E8E93]">{item.date}</Text>
              </View>
            ) : (
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
            )}
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
    </Swipeable>
  );
}
