import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-800">Expense Tracker</Text>
      <Link href="/login" className="mt-4 text-blue-500">Go to Login</Link>
    </View>
  );
}
