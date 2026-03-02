import { Tabs } from "expo-router";
import { View } from "react-native";
// (We will add custom icons here later)

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a", // slate-900
          borderTopWidth: 1,
          borderTopColor: "#334155", // slate-700
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: "#34d399", // emerald-400
        tabBarInactiveTintColor: "#64748b", // slate-500
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Expenses",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
