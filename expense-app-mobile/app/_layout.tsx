import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import "../global.css";
import { useAuth } from "../lib/AuthProvider";
import { Providers } from "../lib/Providers";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "index" || !segments[0];
    const inTabsGroup = segments[0] === "(tabs)";
    const inSettingsGroup = segments[0] === "settings";

    if (!session && !inAuthGroup) {
      // Redirect to the login page.
      router.replace("/login");
    } else if (session && inAuthGroup) {
      // Redirect to the dashboard.
      router.replace("/(tabs)/");
    } else if (session && !inTabsGroup && !inAuthGroup && !inSettingsGroup) {
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#34d399" />
      </View>
    );
  }

  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}
