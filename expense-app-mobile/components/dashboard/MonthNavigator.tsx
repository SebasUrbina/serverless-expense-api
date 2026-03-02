import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MonthNavigatorProps {
  currentDate: Date;
  onChangeMonth: (date: Date) => void;
}

export function MonthNavigator({ currentDate, onChangeMonth }: MonthNavigatorProps) {
  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onChangeMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onChangeMonth(next);
  };

  // Format: "October 2026"
  const monthLabel = currentDate.toLocaleString("es-CL", { month: "long", year: "numeric" });

  // Only allow navigating up to the current real world month
  const now = new Date();
  const isCurrentMonth = currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth();

  return (
    <View className="flex-row items-center justify-between px-6 py-2">
      <TouchableOpacity 
        onPress={handlePrevMonth}
        className="w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E]"
      >
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <Text className="text-base font-semibold text-white tracking-wide">
        {monthLabel}
      </Text>

      <TouchableOpacity 
        onPress={handleNextMonth}
        disabled={isCurrentMonth}
        className="w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E]"
        style={{ opacity: isCurrentMonth ? 0.4 : 1 }}
      >
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
