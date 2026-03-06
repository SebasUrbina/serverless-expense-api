import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from "react-native-reanimated";

export default function PrivacyPolicy() {
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <View className="items-center mb-8 mt-4">
            <View className="w-16 h-16 rounded-2xl bg-[#30D158]/20 items-center justify-center mb-4">
              <Ionicons name="shield-checkmark" size={32} color="#30D158" />
            </View>
            <Text className="text-white text-2xl font-bold tracking-tight">Your Data is Safe</Text>
            <Text className="text-[#8E8E93] text-center mt-2 leading-5">
              We believe in complete transparency about how we treat your financial information.
            </Text>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(400).delay(100).springify()}
          className="bg-[#1C1C1E] border border-[#2C2C2E] p-5 rounded-3xl mb-6"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="lock-closed-outline" size={20} color="#30D158" className="mr-3" />
            <Text className="text-white font-bold text-lg tracking-tight ml-2">Encrypted Transactions</Text>
          </View>
          <Text className="text-[#A1A1A6] leading-6">
            All your expenses, incomes, and custom categories are fully encrypted both in transit and at rest. We utilize industry-standard cryptographic protocols to ensure nobody but you can access or read your financial logs.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(400).delay(150).springify()}
          className="bg-[#1C1C1E] border border-[#2C2C2E] p-5 rounded-3xl mb-6"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="eye-off-outline" size={20} color="#0A84FF" className="mr-3" />
            <Text className="text-white font-bold text-lg tracking-tight ml-2">Zero Tracking</Text>
          </View>
          <Text className="text-[#A1A1A6] leading-6">
            We never sell, rent, or trade your data to third parties. Seva App contains no hidden trackers or invasive analytics. The app exists solely to provide you an uninterrupted local-first tracking experience.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(400).delay(200).springify()}
          className="bg-[#1C1C1E] border border-[#2C2C2E] p-5 rounded-3xl mb-8"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="server-outline" size={20} color="#BF5AF2" className="mr-3" />
            <Text className="text-white font-bold text-lg tracking-tight ml-2">Supabase Infrastructure</Text>
          </View>
          <Text className="text-[#A1A1A6] leading-6 mb-4">
            Your login identity and encrypted records are securely hosted utilizing SOC2-compliant Supabase cloud architecture. Passwords are mathematically hashed and invisible even to our servers.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(250).springify()}>
          <Text className="text-[#8E8E93] font-bold text-xs uppercase tracking-wider mb-3 ml-2">Questions or concerns?</Text>
          
          <TouchableOpacity 
            className="bg-[#2C2C2E] p-4 rounded-[20px] flex-row items-center justify-between"
            onPress={() => Linking.openURL("mailto:privacy@seva.app")}
          >
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="white" />
              <Text className="text-white ml-3 font-medium text-base">Contact Privacy Team</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
