import {
  View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import { RecurringRule } from "./RecurringRuleCard";

interface RecurringModalProps {
  rule: RecurringRule | null;   // null = creating new
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<RecurringRule>) => void;
  isSaving: boolean;
}

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

export function RecurringModal({ rule, visible, onClose, onSave, isSaving }: RecurringModalProps) {
  const [title, setTitle]           = useState("");
  const [amount, setAmount]         = useState("");
  const [category, setCategory]     = useState("");
  const [type, setType]             = useState<"expense" | "income">("expense");
  const [account, setAccount]       = useState("");
  const [tag, setTag]               = useState("");
  const [frequency, setFrequency]   = useState<typeof FREQUENCIES[number]>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [nextRun, setNextRun]       = useState("");

  // Pre-fill when editing an existing rule
  const prevId = useRef<number | null>(null);
  const isNew = rule === null;

  if (!isNew && rule.id !== prevId.current) {
    prevId.current = rule.id;
    setTitle(rule.title);
    setAmount(String(rule.amount));
    setCategory(rule.category);
    setType(rule.type as "expense" | "income");
    setAccount(rule.account);
    setTag(rule.tag ?? "");
    setFrequency(rule.frequency);
    setDayOfMonth(String(rule.day_of_month ?? 1));
    setNextRun(rule.next_run);
  }

  // Reset when opening as "new"
  if (isNew && prevId.current !== null) {
    prevId.current = null;
    setTitle(""); setAmount(""); setCategory(""); setType("expense");
    setAccount(""); setTag(""); setFrequency("monthly"); setDayOfMonth("1");
    // Default next_run = today
    setNextRun(new Date().toISOString().split("T")[0]);
  }

  const labelClass = "text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-1";
  const inputClass = "bg-[#2C2C2E] text-white rounded-xl px-4 py-3.5 text-base mb-4";

  const handleSave = () => {
    onSave({
      title,
      amount: parseFloat(amount) || 0,
      category,
      type,
      account,
      tag: tag.trim() || null,
      frequency,
      day_of_month: frequency === "monthly" ? (parseInt(dayOfMonth) || 1) : null,
      next_run: nextRun,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View className="bg-[#1C1C1E] rounded-t-[32px] px-6 pt-4 pb-10 border-t border-[#2C2C2E]">
          {/* Drag handle */}
          <View className="w-10 h-1 rounded-full bg-[#3A3A3C] self-center mb-5" />

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-xl font-bold">
              {isNew ? "New Recurring Rule" : "Edit Rule"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#636366" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type */}
            <Text className={labelClass}>Type</Text>
            <View className="flex-row bg-[#2C2C2E] rounded-xl p-1 mb-4">
              {(["expense", "income"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-lg items-center ${
                    type === t ? (t === "expense" ? "bg-[#FF453A]" : "bg-emerald-500") : ""
                  }`}
                >
                  <Text className={`text-sm font-semibold capitalize ${type === t ? "text-white" : "text-[#8E8E93]"}`}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequency */}
            <Text className={labelClass}>Frequency</Text>
            <View className="flex-row bg-[#2C2C2E] rounded-xl p-1 mb-4">
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  className={`flex-1 py-2 rounded-lg items-center ${frequency === f ? "bg-[#0A84FF]" : ""}`}
                >
                  <Text className={`text-xs font-semibold capitalize ${frequency === f ? "text-white" : "text-[#8E8E93]"}`}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className={labelClass}>Title</Text>
            <TextInput className={inputClass} value={title} onChangeText={setTitle} placeholder="Netflix" placeholderTextColor="#636366" />

            <Text className={labelClass}>Amount</Text>
            <TextInput className={inputClass} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor="#636366" />

            <Text className={labelClass}>Category</Text>
            <TextInput className={inputClass} value={category} onChangeText={setCategory} placeholder="Entertainment" placeholderTextColor="#636366" />

            <Text className={labelClass}>Account</Text>
            <TextInput className={inputClass} value={account} onChangeText={setAccount} placeholder="Credit Card" placeholderTextColor="#636366" />

            <Text className={labelClass}>Tag (optional)</Text>
            <TextInput className={inputClass} value={tag} onChangeText={setTag} placeholder="subscription" placeholderTextColor="#636366" />

            {frequency === "monthly" && (
              <>
                <Text className={labelClass}>Day of Month (1–28)</Text>
                <TextInput className={inputClass} value={dayOfMonth} onChangeText={setDayOfMonth} keyboardType="numeric" placeholder="1" placeholderTextColor="#636366" />
              </>
            )}

            <Text className={labelClass}>First Run Date (YYYY-MM-DD)</Text>
            <TextInput className={inputClass} value={nextRun} onChangeText={setNextRun} placeholder="2025-03-05" placeholderTextColor="#636366" />

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="mt-2 py-4 rounded-2xl bg-[#0A84FF] items-center"
            >
              {isSaving
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">
                    {isNew ? "Create Rule" : "Save Changes"}
                  </Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
