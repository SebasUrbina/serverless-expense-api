import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  return (
    <TouchableOpacity
      onLongPress={() =>
        Alert.alert(rule.title, "What would you like to do?", [
          { text: "✏️  Edit",                          onPress: () => onEdit(rule) },
          { text: isInactive ? "▶  Resume" : "⏸  Pause", onPress: () => onToggle(rule) },
          { text: "🗑  Delete", style: "destructive",   onPress: () => onDelete(rule.id) },
          { text: "Cancel",    style: "cancel" },
        ])
      }
      delayLongPress={400}
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
  );
}
