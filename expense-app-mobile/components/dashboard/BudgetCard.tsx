import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BudgetCardProps {
  budget: number;
  remaining: number;
  spentPercent: number;
  showBudgetModal: boolean;
  setShowBudgetModal: (show: boolean) => void;
  budgetInput: string;
  setBudgetInput: (val: string) => void;
  saveBudget: () => void;
}

export function BudgetCard({
  budget, remaining, spentPercent,
  showBudgetModal, setShowBudgetModal,
  budgetInput, setBudgetInput, saveBudget
}: BudgetCardProps) {
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { setBudgetInput(String(budget)); setShowBudgetModal(true); }}
        className="mx-4 mt-6 bg-[#1C1C1E] rounded-[24px] p-5"
      >
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "rgba(48,209,88,0.12)" }}>
              <Ionicons name="wallet" size={22} color="#30D158" />
            </View>
            <View>
              <Text className="text-xs text-[#8E8E93] font-bold uppercase tracking-widest">Monthly Budget</Text>
              <Text className="text-xl font-bold text-white">
                ${budget.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs text-[#8E8E93] font-bold uppercase tracking-widest">Remaining</Text>
            <Text className="text-xl font-bold text-[#30D158]">
              ${remaining.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <View
            className="h-full rounded-full"
            style={{ width: `${spentPercent}%`, backgroundColor: spentPercent > 90 ? "#FF453A" : "#30D158" }}
          />
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-medium text-[#8E8E93]">Total spent progress</Text>
          <Text className="text-sm font-bold" style={{ color: spentPercent > 90 ? "#FF453A" : "#30D158" }}>
            {spentPercent}% of total
          </Text>
        </View>
      </TouchableOpacity>

      {/* Budget Edit Modal */}
      <Modal visible={showBudgetModal} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowBudgetModal(false)}
            className="flex-1 bg-black/60 justify-center items-center px-6"
          >
            <TouchableOpacity activeOpacity={1} className="bg-[#1C1C1E] rounded-[28px] p-6 w-full border border-[#2C2C2E] shadow-2xl">
              <View className="items-center mb-6">
                <View className="w-12 h-12 rounded-full items-center justify-center bg-blue-500/10 mb-4">
                  <Ionicons name="wallet" size={24} color="#0A84FF" />
                </View>
                <Text className="text-white text-2xl font-bold mb-1 tracking-tight text-center">Mensualidad</Text>
                <Text className="text-[#8E8E93] text-sm text-center px-4">
                  Define tu límite de gastos para este mes.
                </Text>
              </View>

              <View className="flex-row justify-center items-end mb-8 py-2">
                <Text className="text-[#8E8E93] text-2xl font-bold mr-1 mb-1">$</Text>
                <TextInput
                  value={
                    budgetInput 
                      ? parseInt(budgetInput, 10).toLocaleString("es-CL") 
                      : ""
                  }
                  onChangeText={(val) => {
                    // Solo mantener números
                    const cleaned = val.replace(/\D/g, "");
                    setBudgetInput(cleaned);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#38383A"
                  className="text-white text-5xl font-extrabold tracking-tighter text-center"
                  style={{ minWidth: 100 }}
                  autoFocus
                  maxLength={10}
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowBudgetModal(false)}
                  className="flex-1 py-4 rounded-xl bg-[#2C2C2E] items-center"
                >
                  <Text className="text-white font-semibold text-base">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveBudget}
                  className="flex-1 py-4 rounded-xl bg-[#0A84FF] items-center"
                >
                  <Text className="text-white font-semibold text-base">Guardar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
