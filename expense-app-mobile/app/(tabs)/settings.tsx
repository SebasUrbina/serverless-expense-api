import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../lib/api";
import * as Clipboard from "expo-clipboard";

export default function Settings() {
  const api = useApi();
  const queryClient = useQueryClient();

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
      // Update the cache with the new key
      queryClient.setQueryData(["apiKey"], newKey);
    },
  });

  const handleCopyKey = async () => {
    if (apiKey) {
      await Clipboard.setStringAsync(apiKey);
      Alert.alert("Copied!", "Your API key has been copied to your clipboard.");
    }
  };

  const handleDownloadShortcut = () => {
    Linking.openURL("https://www.icloud.com/shortcuts/a066d55051cd4144b17edf9a6d5a554e");
  };

  return (
    <View className="flex-1 px-4 pt-16 bg-black">
      <Text className="text-3xl text-white font-extrabold mb-8 tracking-tight">Settings</Text>
      
      {/* iOS Shortcuts Integration Section */}
      <View className="bg-[#1C1C1E] p-5 rounded-[24px] mb-8 border border-[#2C2C2E]">
        <Text className="text-white font-bold mb-1.5 text-xl tracking-tight">Siri & Shortcuts</Text>
        <Text className="text-[#8E8E93] mb-6 text-sm leading-5">
          Connect your Expense Tracker natively to iOS Shortcuts and Siri using a long-lived API key.
        </Text>

        <View className="bg-black rounded-xl p-4 mb-5 border border-[#2C2C2E]">
          <Text className="text-[#8E8E93] font-semibold mb-2 text-xs uppercase tracking-wider">Your Secret API Key</Text>
          {isLoading ? (
            <ActivityIndicator color="#34d399" />
          ) : apiKey ? (
            <TouchableOpacity onPress={handleCopyKey} className="flex-row items-center justify-between">
              <Text className="text-emerald-400 font-mono text-sm" numberOfLines={1} ellipsizeMode="tail">
                {apiKey}
              </Text>
              <Text className="text-white font-semibold text-sm ml-2 bg-[#2C2C2E] px-2 py-1 rounded-md">Copy</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-[#8E8E93] text-sm italic">No API key generated yet</Text>
          )}
        </View>

        <TouchableOpacity 
          className="bg-[#2C2C2E] px-4 py-3.5 rounded-xl mb-3 active:bg-[#3A3A3C] flex-row justify-center items-center"
          onPress={() => generateKeyMutation.mutate()}
          disabled={generateKeyMutation.isPending}
        >
          {generateKeyMutation.isPending ? (
            <ActivityIndicator color="#34d399" />
          ) : (
            <Text className="text-white font-semibold text-base">
              {generateKeyMutation.isPending ? "Generating..." : (apiKey ? "Regenerate API Key" : "Generate API Key")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-[#0A84FF] px-4 py-3.5 rounded-xl active:bg-[#007AFF] flex-row justify-center items-center"
          onPress={handleDownloadShortcut}
        >
          <Text className="text-white font-semibold text-base">Download iOS Shortcut</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View className="bg-[#1C1C1E] p-5 rounded-[24px] border border-[#2C2C2E]">
        <Text className="text-white font-bold mb-4 text-xl tracking-tight">Account</Text>
        <TouchableOpacity 
          className="bg-[#2C2C2E] px-4 py-3.5 rounded-xl active:bg-[#3A3A3C] flex-row justify-center items-center"
          onPress={() => supabase.auth.signOut()}
        >
           <Text className="text-[#FF453A] font-semibold text-base">Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
