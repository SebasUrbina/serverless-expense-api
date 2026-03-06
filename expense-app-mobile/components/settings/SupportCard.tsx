import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";

export function SupportCard() {
  const router = useRouter();
  return (
    <>
      <Text className="text-[#8E8E93] font-bold text-xs uppercase tracking-wider mb-3 ml-2">Support</Text>

      <Animated.View 
        entering={FadeInDown.duration(400).delay(200).springify()}
        className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-[#2C2C2E] mb-8"
      >
        <TouchableOpacity 
          className="flex-row items-center justify-between px-5 py-4 border-b border-[#2C2C2E]"
          onPress={() => Linking.openURL("mailto:support@seva.app")}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#0A84FF]/20 items-center justify-center mr-3">
              <Ionicons name="help-buoy-outline" size={18} color="#0A84FF" />
            </View>
            <Text className="text-white font-medium text-base">Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#636366" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center justify-between px-5 py-4 border-b border-[#2C2C2E]"
          onPress={() => router.push("/settings/privacy")}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#30D158]/20 items-center justify-center mr-3">
              <Ionicons name="shield-checkmark-outline" size={18} color="#30D158" />
            </View>
            <Text className="text-white font-medium text-base">Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#636366" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-[#FF453A]/20 items-center justify-center mr-3">
              <Ionicons name="heart-outline" size={18} color="#FF453A" />
            </View>
            <Text className="text-white font-medium text-base">Rate Seva App</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#636366" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}
