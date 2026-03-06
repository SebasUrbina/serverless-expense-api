import { View, Text, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';

export default function NotificationsSettings() {
  const [dailyReminders, setDailyReminders] = useState(true);
  const [expenseAlerts, setExpenseAlerts] = useState(false);
  
  return (
    <View className="flex-1 bg-black p-4">
      <Stack.Screen options={{ title: 'Notifications' }} />
      <Text className="text-[#8E8E93] uppercase text-xs mt-4 mb-2 ml-2 font-bold tracking-wider">Push Notifications</Text>
      <View className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[#2C2C2E]">
        <View className="flex-row items-center justify-between p-4 border-b border-[#2C2C2E]">
          <View>
            <Text className="text-white text-base font-medium mb-1">Daily Reminders</Text>
            <Text className="text-[#8E8E93] text-xs pr-4 max-w-[280px]">Remind me to log my expenses daily at 8 PM</Text>
          </View>
          <Switch 
            value={dailyReminders} 
            onValueChange={setDailyReminders} 
            trackColor={{ false: '#3A3A3C', true: '#30D158' }}
            thumbColor="#FFF"
          />
        </View>
        <View className="flex-row items-center justify-between p-4">
          <View>
            <Text className="text-white text-base font-medium mb-1">Budget Alerts</Text>
            <Text className="text-[#8E8E93] text-xs pr-4 max-w-[280px]">Notify me when I approach my budget limits</Text>
          </View>
          <Switch 
            value={expenseAlerts} 
            onValueChange={setExpenseAlerts} 
            trackColor={{ false: '#3A3A3C', true: '#30D158' }}
            thumbColor="#FFF"
          />
        </View>
      </View>
    </View>
  );
}
