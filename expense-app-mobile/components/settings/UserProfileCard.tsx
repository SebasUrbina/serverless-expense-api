import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export function UserProfileCard({ session }: { session: Session | null }) {
  const user = session?.user;
  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      <Animated.View 
        entering={FadeInDown.duration(400).delay(50).springify()}
        className="flex-row items-center bg-[#1C1C1E] rounded-[24px] p-4 mb-8 border border-[#2C2C2E]"
      >
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            className="w-16 h-16 rounded-full mr-4 bg-[#2C2C2E]"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-[#30D158]/20 items-center justify-center mr-4">
            <Text className="text-[#30D158] text-2xl font-bold uppercase">{username.charAt(0)}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-white font-bold text-xl">{username}</Text>
          <Text className="text-[#8E8E93] text-sm mt-1">{user?.email}</Text>
        </View>
      </Animated.View>
    </>
  );
}

export function AccountActionsCard() {
  return (
    <Animated.View 
      entering={FadeInDown.duration(400).delay(250).springify()}
      className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-[#2C2C2E]"
    >
      <TouchableOpacity 
        className="flex-row items-center justify-between px-5 py-4 active:bg-[#2C2C2E]"
        onPress={() => {
          Alert.alert("Cerrar Sesión", "¿Seguro que quieres cerrar sesión?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar Sesión", style: "destructive", onPress: () => supabase.auth.signOut() },
          ]);
        }}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-[#FF453A]/10 items-center justify-center mr-3">
            <Ionicons name="log-out-outline" size={18} color="#FF453A" />
          </View>
          <Text className="text-[#FF453A] font-medium text-base">Cerrar Sesión</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
