import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";

export function PreferencesCard() {
  const router = useRouter();
  
  return (
    <>
      <Text className="text-[#8E8E93] font-bold text-xs uppercase tracking-wider mb-3 ml-2">Preferences</Text>

      <Animated.View 
        entering={FadeInDown.duration(400).delay(150).springify()}
        className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-[#2C2C2E] mb-8"
      >
        <TouchableOpacity 
          className="flex-row items-center justify-between px-5 py-4 border-b border-[#2C2C2E]"
          onPress={() => router.push("/settings/appearance")}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#30D158]/20 items-center justify-center mr-3">
              <Ionicons name="color-palette-outline" size={18} color="#30D158" />
            </View>
            <Text className="text-white font-medium text-base">Appearance</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-[#8E8E93] mr-2">Dark</Text>
            <Ionicons name="chevron-forward" size={16} color="#636366" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center justify-between px-5 py-4 border-b border-[#2C2C2E]"
          onPress={() => router.push("/settings/currency")}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#FF9F0A]/20 items-center justify-center mr-3">
              <Ionicons name="globe-outline" size={18} color="#FF9F0A" />
            </View>
            <Text className="text-white font-medium text-base">Currency & Language</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#636366" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center justify-between px-5 py-4"
          onPress={() => router.push("/settings/notifications")}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#BF5AF2]/20 items-center justify-center mr-3">
              <Ionicons name="notifications-outline" size={18} color="#BF5AF2" />
            </View>
            <Text className="text-white font-medium text-base">Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#636366" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}
