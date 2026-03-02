import {
  View, Text, Modal, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import { Transaction } from "./TransactionItem";

interface EditModalProps {
  item: Transaction | null;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Transaction>) => void;
  isSaving: boolean;
}

export function EditModal({ item, visible, onClose, onSave, isSaving }: EditModalProps) {
  const [title, setTitle]       = useState("");
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState("");
  const [type, setType]         = useState<"expense" | "income">("expense");
  const [account, setAccount]   = useState("");
  const [tag, setTag]           = useState("");
  const [date, setDate]         = useState("");

  // Pre-fill when a new item is passed
  const prevId = useRef<number | null>(null);
  if (item && item.id !== prevId.current) {
    prevId.current = item.id;
    setTitle(item.title);
    setAmount(String(item.amount));
    setCategory(item.category);
    setType(item.type as "expense" | "income");
    setAccount(item.account);
    setTag(item.tag ?? "");
    setDate(item.date);
  }

  const labelClass = "text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-1";
  const inputClass = "bg-[#2C2C2E] text-white rounded-xl px-4 py-3.5 text-base mb-4";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View className="bg-[#1C1C1E] rounded-t-[32px] px-6 pt-6 pb-10 border-t border-[#2C2C2E]">

          {/* Drag handle */}
          <View className="w-10 h-1 rounded-full bg-[#3A3A3C] self-center mb-5" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-xl font-bold">Edit Transaction</Text>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center">
              <Ionicons name="close" size={22} color="#636366" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type toggle */}
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

            <Text className={labelClass}>Title</Text>
            <TextInput className={inputClass} value={title} onChangeText={setTitle} placeholderTextColor="#636366" placeholder="Coffee at Starbucks" />

            <Text className={labelClass}>Amount</Text>
            <TextInput className={inputClass} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor="#636366" placeholder="0" />

            <Text className={labelClass}>Category</Text>
            <TextInput className={inputClass} value={category} onChangeText={setCategory} placeholderTextColor="#636366" placeholder="Food" />

            <Text className={labelClass}>Account</Text>
            <TextInput className={inputClass} value={account} onChangeText={setAccount} placeholderTextColor="#636366" placeholder="Bank" />

            <Text className={labelClass}>Tag (optional)</Text>
            <TextInput className={inputClass} value={tag} onChangeText={setTag} placeholderTextColor="#636366" placeholder="personal" />

            <Text className={labelClass}>Date (YYYY-MM-DD)</Text>
            <TextInput className={inputClass} value={date} onChangeText={setDate} placeholderTextColor="#636366" placeholder="2025-03-01" />

            <TouchableOpacity
              onPress={() =>
                onSave({ title, amount: parseFloat(amount) || 0, category, type, account, tag: tag.trim() || null, date })
              }
              disabled={isSaving}
              className="mt-2 py-4 rounded-2xl bg-[#0A84FF] items-center"
            >
              {isSaving
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">Save Changes</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
