import { View, Text } from "react-native";
import { Transaction, TransactionItem } from "./TransactionItem";

interface TransactionGroupProps {
  title: string;
  data: Transaction[];
  onEdit: (item: Transaction) => void;
  onDelete: (id: number) => void;
}

export function TransactionGroup({ title, data, onEdit, onDelete }: TransactionGroupProps) {
  return (
    <View className="mb-5">
      {/* Section header — iOS-style sticky label */}
      <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-widest px-1 mb-2">
        {title}
      </Text>

      {/* Card con todos los ítems del día */}
      <View className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[#2C2C2E]">
        {data.map((item, idx) => {
          const isLast = idx === data.length - 1;
          return (
            <View key={item.id}>
              <TransactionItem item={item} onEdit={onEdit} onDelete={onDelete} />
              {/* Separador interno — se omite en el último ítem */}
              {!isLast && <View className="h-[0.5px] bg-[#2C2C2E] ml-[60px]" />}
            </View>
          );
        })}
      </View>
    </View>
  );
}
