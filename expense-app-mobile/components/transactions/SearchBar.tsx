import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export function SearchBar({ value, onChangeText, onClear }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-[#1C1C1E] rounded-xl px-3 py-2.5 mb-4 border border-[#2C2C2E]">
      <Ionicons name="search" size={16} color="#636366" style={{ marginRight: 8 }} />
      <TextInput
        className="flex-1 text-white text-base"
        placeholder="Search transactions..."
        placeholderTextColor="#636366"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        clearButtonMode="never"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View className="w-5 h-5 rounded-full bg-[#636366] items-center justify-center">
            <Ionicons name="close" size={12} color="#1C1C1E" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
