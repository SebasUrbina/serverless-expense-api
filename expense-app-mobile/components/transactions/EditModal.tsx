import {
  View, Text, Modal, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useState, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
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
  const [amountRaw, setAmountRaw] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType]         = useState<"expense" | "income">("expense");
  const [account, setAccount]   = useState("");
  const [tag, setTag]           = useState("");
  const [date, setDate]         = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker]   = useState(false);

  // Pre-fill when a new item is passed
  const prevId = useRef<number | null>(null);
  if (item && item.id !== prevId.current) {
    prevId.current = item.id;
    setTitle(item.title);
    setAmountRaw(String(item.amount));
    setCategory(item.category);
    setType(item.type as "expense" | "income");
    setAccount(item.account);
    setTag(item.tag ?? "");
    setDate(new Date(item.date + "T12:00:00")); // Prevent timezone shift
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
      date: date.toISOString().split('T')[0] 
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
            <Text className="text-white text-base font-bold">Edit</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-2 py-1 flex-row items-center">
              {isSaving ? <ActivityIndicator size="small" color="#0A84FF" /> : <Text className="text-[#0A84FF] text-base font-bold">Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: showTagPicker ? 120 : 20 }}>
            
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
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Type toggle */}
            <View className="flex-row bg-[#2C2C2E]/60 rounded-xl p-1 mb-5">
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

            {/* Title (Full Width) */}
            <View className="mb-1">
               <Text className={labelClass}>Description</Text>
               <View className={inputContainerClass}>
                 <TextInput 
                   className="text-white text-[15px] p-0" 
                   value={title} 
                   onChangeText={setTitle} 
                   placeholderTextColor="#636366" 
                   placeholder="E.g. Coffee" 
                 />
               </View>
            </View>

            {/* Category & Date (Same Row) */}
            <View className="flex-row gap-3">
               <View className="flex-[3]">
                  <Text className={labelClass}>Category</Text>
                  <View className={inputContainerClass}>
                    <TextInput className="text-white text-[15px] p-0" value={category} onChangeText={setCategory} placeholderTextColor="#636366" placeholder="Food" />
                  </View>
               </View>

               <View className="flex-[2]">
                  <Text className={labelClass}>Date</Text>
                  <TouchableOpacity 
                    className={`${inputContainerClass} flex-row items-center justify-between`}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text className="text-white text-[15px]">{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
                    <Ionicons name="calendar-outline" size={16} color="#0A84FF" />
                  </TouchableOpacity>
               </View>
            </View>

            {/* Account & Tag */}
            <View className="flex-row gap-3">
               <View className="flex-1">
                  <Text className={labelClass}>Account</Text>
                  <View className={inputContainerClass}>
                    <TextInput className="text-white text-[15px] p-0" value={account} onChangeText={setAccount} placeholderTextColor="#636366" placeholder="Bank" />
                  </View>
               </View>
                   <View className="flex-1">
                    <Text className={labelClass}>Tag</Text>
                    <TouchableOpacity 
                      className={`${inputContainerClass} flex-row items-center justify-between z-50`}
                      onPress={() => setShowTagPicker(!showTagPicker)}
                    >
                      <Text className={`text-[15px] ${tag ? "text-white" : "text-[#636366]"}`}>
                        {tag || "Select tag"}
                      </Text>
                      <Ionicons name={showTagPicker ? "chevron-up" : "chevron-down"} size={16} color="#0A84FF" />
                    </TouchableOpacity>
                 </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Pop-up Selector Overlay - No KeyboardAvoidingView to prevent jump */}
      {showTagPicker && (
        <Modal transparent animationType="fade" visible={showTagPicker}>
          <TouchableWithoutFeedback onPress={() => setShowTagPicker(false)}>
            <View className="flex-1 px-5">
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View className="absolute bottom-[240px] right-5 bg-[#2C2C2E] border border-white/10 rounded-xl overflow-hidden shadow-2xl w-[45%]">
                  {["Fixed", "Variable"].map((presetTag, idx) => (
                    <TouchableOpacity
                      key={presetTag}
                      onPress={() => { setTag(presetTag); setShowTagPicker(false); }}
                      className={`flex-row items-center justify-between py-3 px-3 ${idx !== 0 ? "border-t border-[#3A3A3C]" : ""}`}
                    >
                      <Text className={`text-[14px] leading-tight ${tag === presetTag ? "text-[#0A84FF] font-semibold" : "text-white"}`}>
                        {presetTag}
                      </Text>
                      {tag === presetTag && <Ionicons name="checkmark" size={16} color="#0A84FF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Inline Date Picker Modal for iOS/Android consistency */}
      {showDatePicker && (
        <Modal transparent animationType="fade" visible={showDatePicker}>
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View className="flex-1 justify-center items-center bg-black/60 px-4">
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View className="bg-[#1C1C1E] rounded-3xl p-4 w-full border-[#2C2C2E]">
                   <DateTimePicker
                     value={date}
                     mode="date"
                     display={Platform.OS === 'ios' ? 'inline' : 'default'}
                     themeVariant="dark"
                     onChange={(event, selectedDate) => {
                       if (selectedDate) {
                         setDate(selectedDate);
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
