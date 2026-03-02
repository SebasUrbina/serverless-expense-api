import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import "../global.css";
import { useAuth } from "../lib/AuthProvider";
import { Providers } from "../lib/Providers";

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!session && !inAuthGroup) {
      // Redirect to the login page.
      router.replace("/login");
    } else if (session && inAuthGroup) {
      // Redirect to the dashboard.
      router.replace("/(tabs)/");
    } else if (session && !inTabsGroup && !inAuthGroup) {
      // Redirect to tabs by default
      router.replace("/(tabs)/");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#34d399" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}
