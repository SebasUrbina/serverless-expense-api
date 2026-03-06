import { View, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function CurrencySettings() {
  const [currency, setCurrency] = useState('clp');
  
  const options = [
    { id: 'clp', label: 'CLP - Chilean Peso' },
    { id: 'usd', label: 'USD - US Dollar' },
    { id: 'eur', label: 'EUR - Euro' }
  ];

  return (
    <View className="flex-1 bg-black p-4">
      <Stack.Screen options={{ title: 'Currency & Language' }} />
      <Text className="text-[#8E8E93] uppercase text-xs mt-4 mb-2 ml-2 font-bold tracking-wider">Default Currency</Text>
      <View className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[#2C2C2E] mb-6">
        {options.map((option, index) => (
          <TouchableOpacity 
            key={option.id}
            className={`flex-row items-center justify-between p-4 ${index !== options.length - 1 ? 'border-b border-[#2C2C2E]' : ''}`}
            onPress={() => setCurrency(option.id)}
          >
            <Text className="text-white text-base">{option.label}</Text>
            {currency === option.id && <Ionicons name="checkmark" size={20} color="#30D158" />}
          </TouchableOpacity>
        ))}
      </View>
      <Text className="text-[#8E8E93] text-sm ml-2">Note: Language currently matches your OS settings automatically.</Text>
    </View>
  );
}
