import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#1C1C1E' },
        headerTintColor: '#30D158',
        headerTitleStyle: { color: '#fff' },
        headerShadowVisible: false,
        headerBackTitle: "Back",
      }} 
    />
  );
}
