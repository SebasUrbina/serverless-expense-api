import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../lib/api";
import * as Clipboard from "expo-clipboard";

export function IntegrationsCard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);

  // Fetch App Config for Shortcut URL
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ["appConfig"],
    queryFn: async () => {
      const response = await api.get("/config");
      return response.data as { iosShortcutUrl: string };
    },
  });

  // Fetch existing API Key
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ["apiKey"],
    queryFn: async () => {
      const response = await api.get("/keys");
      return response.data.key as string | null;
    },
  });

  // Generate new API Key
  const generateKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/keys");
      return response.data.key as string;
    },
    onSuccess: (newKey) => {
      queryClient.setQueryData(["apiKey"], newKey);
      setShowKey(true);
      Alert.alert("Success", "New API key generated and revealed.");
    },
  });

  const handleCopyKey = async () => {
    if (apiKey) {
      await Clipboard.setStringAsync(apiKey);
      Alert.alert("Copied!", "Your API key has been copied to your clipboard.");
    }
  };

  const handleDownloadShortcut = () => {
    if (config?.iosShortcutUrl) {
      Linking.openURL(config.iosShortcutUrl);
    } else {
      Alert.alert("Error", "Could not fetch shortcut URL from the server.");
    }
  };

  return (
    <>
      <Text className="text-[#8E8E93] font-bold text-xs uppercase tracking-wider mb-3 ml-2">Integrations</Text>
      <Animated.View 
        entering={FadeInDown.duration(400).delay(100).springify()}
        className="bg-[#1C1C1E] rounded-3xl p-5 mb-8 border border-[#2C2C2E]"
      >
        <View className="flex-row items-center mb-4">
          <View className="w-8 h-8 rounded-lg bg-[#0A84FF]/20 items-center justify-center mr-3">
            <Ionicons name="flash-outline" size={18} color="#0A84FF" />
          </View>
          <Text className="text-white font-bold text-lg tracking-tight">iOS Shortcuts</Text>
        </View>

        <Text className="text-[#8E8E93] text-sm mb-5">
          Log expenses instantly via Siri or the widget using your API key.
        </Text>

        <View className="bg-black/40 rounded-2xl p-4 border border-[#2C2C2E] mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest">Secret API Key</Text>
            {apiKey && (
              <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                <Ionicons name={showKey ? "eye-off" : "eye"} size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator color="#0A84FF" size="small" />
          ) : apiKey ? (
            <View className="flex-row items-center justify-between">
              <Text 
                className="text-emerald-400 font-mono text-xs flex-1" 
                numberOfLines={1} 
                ellipsizeMode="middle"
              >
                {showKey ? apiKey : "•••••••••••"}
              </Text>
              <TouchableOpacity 
                onPress={handleCopyKey}
                className="bg-[#2C2C2E] px-3 py-1.5 rounded-lg ml-3"
              >
                <Text className="text-white font-bold text-xs">Copy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-[#636366] text-sm italic py-1">No key generated yet</Text>
          )}
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="flex-1 bg-[#2C2C2E] h-12 rounded-xl justify-center items-center"
            onPress={() => generateKeyMutation.mutate()}
            disabled={generateKeyMutation.isPending}
          >
            {generateKeyMutation.isPending ? (
              <ActivityIndicator color="#30D158" />
            ) : (
              <Text className="text-white font-semibold flex-wrap">{apiKey ? "Regen" : "Generate"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className={`flex-[2] h-12 rounded-xl justify-center items-center flex-row ${isConfigLoading ? 'bg-[#0A84FF]/50' : 'bg-[#0A84FF]'}`}
            onPress={handleDownloadShortcut}
            disabled={isConfigLoading}
          >
            {isConfigLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="white" className="mr-2" />
                <Text className="text-white font-semibold ml-2">Get Shortcut</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}
