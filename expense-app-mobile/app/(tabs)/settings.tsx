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
    <View className="flex-1 px-4 pt-10 bg-slate-900">
      <Text className="text-3xl text-white font-extrabold mb-8">Settings</Text>
      
      {/* iOS Shortcuts Integration Section */}
      <View className="bg-slate-800 p-5 rounded-3xl mb-8 border border-slate-700">
        <Text className="text-white font-bold mb-2 text-xl">Siri & Shortcuts</Text>
        <Text className="text-slate-400 mb-6 text-sm">
          Connect your Expense Tracker natively to iOS Shortcuts and Siri using a long-lived API key.
        </Text>

        <View className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-700">
          <Text className="text-slate-500 font-medium mb-2 text-xs uppercase tracking-wider">Your Secret API Key</Text>
          {isLoading ? (
            <ActivityIndicator color="#34d399" />
          ) : apiKey ? (
            <TouchableOpacity onPress={handleCopyKey} className="flex-row items-center justify-between">
              <Text className="text-emerald-400 font-mono text-base" numberOfLines={1} ellipsizeMode="tail">
                {apiKey}
              </Text>
              <Text className="text-slate-400 text-xs ml-2">Copy</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-slate-500 text-sm italic">No API key generated yet</Text>
          )}
        </View>

        <TouchableOpacity 
          className="bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 mb-3 active:bg-emerald-500/20 flex-row justify-center items-center"
          onPress={() => generateKeyMutation.mutate()}
          disabled={generateKeyMutation.isPending}
        >
          {generateKeyMutation.isPending ? (
            <ActivityIndicator color="#34d399" />
          ) : (
            <Text className="text-emerald-400 font-bold">
              {apiKey ? "Regenerate API Key" : "Generate API Key"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-blue-500 px-4 py-3 rounded-xl active:bg-blue-600 flex-row justify-center items-center"
          onPress={handleDownloadShortcut}
        >
          <Text className="text-white font-bold">Download iOS Shortcut</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
        <Text className="text-white font-bold mb-4 text-xl">Account</Text>
        <TouchableOpacity 
          className="bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 active:bg-red-500/20 flex-row justify-center items-center"
          onPress={() => supabase.auth.signOut()}
        >
           <Text className="text-red-400 font-bold">Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
