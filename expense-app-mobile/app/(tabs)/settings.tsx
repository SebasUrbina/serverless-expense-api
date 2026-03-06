import { View, Text, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "../../lib/AuthProvider";

import { UserProfileCard, AccountActionsCard } from "../../components/settings/UserProfileCard";
import { IntegrationsCard } from "../../components/settings/IntegrationsCard";
import { PreferencesCard } from "../../components/settings/PreferencesCard";
import { SupportCard } from "../../components/settings/SupportCard";

export default function Settings() {
  const { session } = useAuth();

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 64, paddingBottom: 100 }}
      >
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <Text className="text-3xl text-white font-extrabold mb-6 tracking-tight">Settings</Text>
        </Animated.View>

        <UserProfileCard session={session} />
        <IntegrationsCard />
        <PreferencesCard />
        <SupportCard />
        <AccountActionsCard />

        <Text className="text-[#48484A] text-[10px] font-bold text-center mt-8 uppercase tracking-[2px]">
          Seva App v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

