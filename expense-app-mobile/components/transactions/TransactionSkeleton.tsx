import { View } from "react-native";
import { Skeleton } from "../ui/Skeleton";
import Animated, { FadeIn } from "react-native-reanimated";

export function TransactionSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="px-4 mt-4">
      <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: 12, marginLeft: 4 }} />
      <View className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-[#2C2C2E]">
        {[1, 2, 3, 4, 5, 6].map((i, idx) => {
          const isLast = idx === 5;
          return (
            <View key={i}>
              <View className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center flex-1">
                  <Skeleton width={44} height={44} borderRadius={12} style={{ marginRight: 16 }} />
                  <View>
                    <Skeleton width={140} height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                    <Skeleton width={80} height={14} borderRadius={4} />
                  </View>
                </View>
                <Skeleton width={70} height={18} borderRadius={6} />
              </View>
              {!isLast && <View className="h-[0.5px] bg-[#38383A] ml-[72px]" />}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
