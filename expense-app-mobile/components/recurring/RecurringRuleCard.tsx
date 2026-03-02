import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

export type RecurringRule = {
  id: number;
  title: string;
  amount: number;
  category: string;
  type: string;
  account: string;
  tag: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  day_of_month: number | null;
  next_run: string;
  is_active: number;
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const FREQ_COLORS: Record<string, string> = {
  daily:   "#FF9F0A",
  weekly:  "#0A84FF",
  monthly: "#BF5AF2",
  yearly:  "#32D74B",
};

interface RecurringRuleCardProps {
  rule: RecurringRule;
  onEdit: (rule: RecurringRule) => void;
  onToggle: (rule: RecurringRule) => void;
  onDelete: (id: number) => void;
}

export function RecurringRuleCard({ rule, onEdit, onToggle, onDelete }: RecurringRuleCardProps) {
  const isExpense  = rule.type === "expense";
  const freqColor  = FREQ_COLORS[rule.frequency] ?? "#8E8E93";
  const isInactive = rule.is_active === 0;

  // Swipe Action: Pause/Resume (Left side)
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });
    
    return (
      <TouchableOpacity 
        onPress={() => onToggle(rule)}
        className={`w-20 items-center justify-center mb-3 rounded-l-2xl ${isInactive ? 'bg-[#32D74B]' : 'bg-[#FF9F0A]'}`}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={isInactive ? "play" : "pause"} size={28} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Swipe Action: Delete (Right side)
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={() => onDelete(rule.id)}
        className="w-20 bg-[#FF3B30] items-center justify-center mb-3 rounded-r-2xl"
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={28} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      overshootFriction={8}
    >
      <TouchableOpacity
        onPress={() => onEdit(rule)}
        activeOpacity={0.75}
      >
        <View
          className={`flex-row items-center bg-[#1C1C1E] p-4 mb-3 rounded-2xl border ${
            isInactive ? "border-[#2C2C2E] opacity-50" : "border-[#2C2C2E]"
          }`}
        >
          {/* Frequency color dot */}
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3 shrink-0"
            style={{ backgroundColor: `${freqColor}20` }}
          >
            <Ionicons name="repeat" size={20} color={freqColor} />
          </View>

          {/* Left */}
          <View className="flex-1 mr-3">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {rule.title}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              {/* Frequency badge */}
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${freqColor}25` }}>
                <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: freqColor }}>
                  {FREQ_LABELS[rule.frequency]}
                </Text>
              </View>
              {/* Account badge */}
              <View className="bg-[#2C2C2E] rounded-full px-2 py-0.5">
                <Text className="text-[#98989D] text-xs font-semibold uppercase tracking-wide" numberOfLines={1}>
                  {rule.account}
                </Text>
              </View>
            </View>
            <Text className="text-[#636366] text-xs mt-1">
              Next: {rule.next_run}
            </Text>
          </View>

          {/* Amount */}
          <Text
            className={`font-bold text-base shrink-0 ${isExpense ? "text-white" : "text-emerald-400"}`}
            numberOfLines={1}
          >
            {isExpense ? "-" : "+"}${rule.amount.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}
