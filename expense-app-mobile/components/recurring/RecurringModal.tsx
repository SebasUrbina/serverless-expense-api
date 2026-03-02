import {
  View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  const [amountRaw, setAmountRaw]   = useState("");
  const [category, setCategory]     = useState("");
  const [type, setType]             = useState<"expense" | "income">("expense");
  const [account, setAccount]       = useState("");
  const [tag, setTag]               = useState("");
  const [frequency, setFrequency]   = useState<typeof FREQUENCIES[number]>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [nextRun, setNextRun]       = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pre-fill when editing an existing rule
  const prevId = useRef<number | null>(null);
  const isNew = rule === null;

  if (!isNew && rule.id !== prevId.current) {
    prevId.current = rule.id;
    setTitle(rule.title);
    setAmountRaw(String(rule.amount));
    setCategory(rule.category);
    setType(rule.type as "expense" | "income");
    setAccount(rule.account);
    setTag(rule.tag ?? "");
    setFrequency(rule.frequency);
    setDayOfMonth(String(rule.day_of_month ?? 1));
    setNextRun(new Date(rule.next_run + "T12:00:00")); // Prevent timezone shift
  }

  // Reset when opening as "new"
  if (isNew && prevId.current !== null) {
    prevId.current = null;
    setTitle(""); setAmountRaw(""); setCategory(""); setType("expense");
    setAccount(""); setTag(""); setFrequency("monthly"); setDayOfMonth("1");
    setNextRun(new Date());
  }

  const labelClass = "text-[#8E8E93] text-[10px] font-semibold uppercase tracking-wider mb-1 px-1";
  const inputContainerClass = "bg-[#2C2C2E]/80 rounded-xl px-4 py-3 mb-3 border border-white/5";

  // Amount formatting
  const handleAmountChange = (text: string) => {
    const numericOnly = text.replace(/\D/g, "");
    setAmountRaw(numericOnly);
  };
  const formattedAmount = amountRaw ? parseInt(amountRaw, 10).toLocaleString("es-CL") : "";

  const handleSave = () => {
    onSave({
      title,
      amount: parseInt(amountRaw, 10) || 0,
      category,
      type,
      account,
      tag: tag.trim() || null,
      frequency,
      day_of_month: frequency === "monthly" ? (parseInt(dayOfMonth) || 1) : null,
      next_run: nextRun.toISOString().split("T")[0],
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        
        {/* Condensed Bottom Sheet */}
        <View className="bg-[#1C1C1E] rounded-t-[32px] px-5 pt-3 pb-8 border-t border-[#2C2C2E] max-h-[85%]">
          
          {/* Drag handle */}
          <View className="w-12 h-1.5 rounded-full bg-[#3A3A3C] self-center mb-4" />

          {/* Header with Cancel and Save */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={onClose} className="px-2 py-1">
              <Text className="text-[#0A84FF] text-base font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-base font-bold">
               {isNew ? "New Rule" : "Edit Rule"}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-2 py-1 flex-row items-center">
              {isSaving ? <ActivityIndicator size="small" color="#0A84FF" /> : <Text className="text-[#0A84FF] text-base font-bold">Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
            
            {/* Amount (Hero) */}
            <View className="items-center mb-6 mt-2">
              <View className="flex-row items-center justify-center bg-[#2C2C2E]/50 rounded-2xl px-6 h-[72px] border border-white/10 min-w-[50%]">
                <Text className={`text-3xl font-light mr-1 ${type === 'expense' ? 'text-[#FF453A]' : 'text-emerald-400'}`}>$</Text>
                <TextInput 
                  className="text-white text-5xl font-bold p-0 m-0 text-center flex-shrink leading-tight" 
                  style={{ textAlignVertical: 'center', includeFontPadding: false }}
                  value={formattedAmount} 
                  onChangeText={handleAmountChange} 
                  keyboardType="numeric" 
                  placeholderTextColor="#636366" 
                  placeholder="0" 
                  autoFocus={isNew}
                />
              </View>
            </View>

            {/* Type toggle */}
            <View className="flex-row gap-2 mb-4">
               <View className="flex-1 flex-row bg-[#2C2C2E]/60 rounded-xl p-1">
                 {(["expense", "income"] as const).map((t) => (
                   <TouchableOpacity
                     key={t}
                     onPress={() => setType(t)}
                     className={`flex-1 py-1.5 rounded-lg items-center ${
                       type === t ? (t === "expense" ? "bg-[#FF453A]" : "bg-emerald-500") : ""
                     }`}
                   >
                     <Text className={`text-[13px] font-semibold capitalize ${type === t ? "text-white" : "text-[#8E8E93]"}`}>
                       {t}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            {/* Frequency */}
            <Text className={labelClass}>Frequency</Text>
            <View className="flex-row bg-[#2C2C2E]/60 rounded-xl p-1 mb-4">
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  className={`flex-1 py-1.5 rounded-lg items-center ${frequency === f ? "bg-[#0A84FF]" : ""}`}
                >
                  <Text className={`text-[12px] font-semibold capitalize ${frequency === f ? "text-white" : "text-[#8E8E93]"}`}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <View className="mb-1">
               <Text className={labelClass}>Title</Text>
               <View className={inputContainerClass}>
                 <TextInput 
                   className="text-white text-[15px] p-0" 
                   value={title} 
                   onChangeText={setTitle} 
                   placeholderTextColor="#636366" 
                   placeholder="E.g. Netflix" 
                 />
               </View>
            </View>

            {/* Category & Date */}
            <View className="flex-row gap-3">
               <View className="flex-[3]">
                  <Text className={labelClass}>Category</Text>
                  <View className={inputContainerClass}>
                    <TextInput className="text-white text-[15px] p-0" value={category} onChangeText={setCategory} placeholderTextColor="#636366" placeholder="Entertainment" />
                  </View>
               </View>

               <View className="flex-[2]">
                  <Text className={labelClass}>First Run</Text>
                  <TouchableOpacity 
                    className={`${inputContainerClass} flex-row items-center justify-between`}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text className="text-white text-[15px]">{nextRun.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
                    <Ionicons name="calendar-outline" size={16} color="#0A84FF" />
                  </TouchableOpacity>
               </View>
            </View>

            {/* Account & Tag/Day Setup */}
            <View className="flex-row gap-3">
               <View className="flex-1">
                  <Text className={labelClass}>Account</Text>
                  <View className={inputContainerClass}>
                    <TextInput className="text-white text-[15px] p-0" value={account} onChangeText={setAccount} placeholderTextColor="#636366" placeholder="Credit Card" />
                  </View>
               </View>

               <View className="flex-1">
                  <Text className={labelClass}>Tag (optional)</Text>
                  <View className={inputContainerClass}>
                    <TextInput className="text-white text-[15px] p-0" value={tag} onChangeText={setTag} placeholderTextColor="#636366" placeholder="subscription" />
                  </View>
               </View>
            </View>
            
            {frequency === "monthly" && (
                <View className="flex-row mb-2">
                   <View className="flex-1">
                      <Text className={labelClass}>Day of Month (1-28)</Text>
                      <View className={inputContainerClass}>
                        <TextInput className="text-white text-[15px] p-0" value={dayOfMonth} onChangeText={setDayOfMonth} keyboardType="numeric" placeholderTextColor="#636366" placeholder="1" />
                      </View>
                   </View>
                </View>
            )}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Inline Date Picker Modal for iOS/Android consistency */}
      {showDatePicker && (
        <Modal transparent animationType="fade" visible={showDatePicker}>
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View className="flex-1 justify-center items-center bg-black/60 px-4">
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View className="bg-[#1C1C1E] rounded-3xl p-4 w-full max-w-sm border border-[#2C2C2E]">
                   <View className="flex-row justify-between items-center mb-4 px-2">
                     <Text className="text-white font-semibold text-lg">Select Date</Text>
                     <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                       <Text className="text-[#0A84FF] font-medium text-base">Close</Text>
                     </TouchableOpacity>
                   </View>
                   <DateTimePicker
                     value={nextRun}
                     mode="date"
                     display={Platform.OS === 'ios' ? 'inline' : 'default'}
                     themeVariant="dark"
                     onChange={(event, selectedDate) => {
                       if (selectedDate) {
                         setNextRun(selectedDate);
                         setShowDatePicker(false);
                       }
                     }}
                   />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </Modal>
  );
}
