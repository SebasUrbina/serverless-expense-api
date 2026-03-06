import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <View className="items-center mb-8">
        <Text className="text-5xl font-extrabold text-white tracking-tighter mb-1">
          Se<Text className="text-[#30D158]">va</Text>
        </Text>
        <Text className="text-gray-400 text-sm font-medium tracking-wide">¿En que seva mi plata?</Text>
      </View>

      <TouchableOpacity
        className="bg-[#30D158] rounded-xl px-8 py-4 active:bg-[#28b34b]"
        onPress={() => router.push("/login")}
      >
        <Text className="text-black font-semibold text-base">Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
