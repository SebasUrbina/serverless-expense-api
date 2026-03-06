import { View, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function AppearanceSettings() {
  const [theme, setTheme] = useState('dark');
  
  const options = [
    { id: 'light', label: 'Light Theme' },
    { id: 'dark', label: 'Dark Theme' },
    { id: 'system', label: 'System Default' }
  ];

  return (
    <View className="flex-1 bg-black p-4">
      <Stack.Screen options={{ title: 'Appearance' }} />
      <View className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[#2C2C2E] mt-4">
        {options.map((option, index) => (
          <TouchableOpacity 
            key={option.id}
            className={`flex-row items-center justify-between p-4 ${index !== options.length - 1 ? 'border-b border-[#2C2C2E]' : ''}`}
            onPress={() => setTheme(option.id)}
          >
            <Text className="text-white text-base">{option.label}</Text>
            {theme === option.id && <Ionicons name="checkmark" size={20} color="#30D158" />}
          </TouchableOpacity>
        ))}
      </View>
      <Text className="text-[#8E8E93] text-sm ml-2 mt-4">For now, Seva operates in dark mode natively to provide the best look and feel for AMOLED screens.</Text>
    </View>
  );
}
