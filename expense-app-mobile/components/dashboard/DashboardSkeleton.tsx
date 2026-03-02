import { View } from "react-native";
import { Skeleton } from "../ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <View className="px-4">
      {/* Donut Chart Card Skeleton */}
      <View className="bg-[#1C1C1E] rounded-[24px] overflow-hidden mb-8 border border-[#2C2C2E] p-6 h-[260px] justify-center items-center mt-6">
        <Skeleton width={160} height={160} borderRadius={80} />
      </View>

      {/* Budget Card Skeleton */}
      <View className="mb-8">
        <Skeleton width={120} height={24} borderRadius={6} style={{ marginBottom: 16 }} />
        <View className="bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-[#2C2C2E] p-5 h-[140px] justify-center">
            <Skeleton width="100%" height={24} borderRadius={6} style={{ marginBottom: 16 }} />
            <Skeleton width="60%" height={40} borderRadius={6} />
        </View>
      </View>

      {/* Recent Expenses Skeleton */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-4">
            <Skeleton width={140} height={24} borderRadius={6} />
            <Skeleton width={60} height={20} borderRadius={6} />
        </View>
        <View className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-[#2C2C2E]">
            <View className="p-4 flex-row items-center justify-between border-b border-[#2C2C2E]">
                <View className="flex-row items-center flex-1">
                    <Skeleton width={44} height={44} borderRadius={12} style={{ marginRight: 16 }} />
                    <View>
                        <Skeleton width={120} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
                        <Skeleton width={80} height={16} borderRadius={4} />
                    </View>
                </View>
                <Skeleton width={80} height={20} borderRadius={6} />
            </View>
            <View className="p-4 flex-row items-center justify-between border-b border-[#2C2C2E]">
                <View className="flex-row items-center flex-1">
                    <Skeleton width={44} height={44} borderRadius={12} style={{ marginRight: 16 }} />
                    <View>
                        <Skeleton width={120} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
                        <Skeleton width={80} height={16} borderRadius={4} />
                    </View>
                </View>
                <Skeleton width={80} height={20} borderRadius={6} />
            </View>
            <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <Skeleton width={44} height={44} borderRadius={12} style={{ marginRight: 16 }} />
                    <View>
                        <Skeleton width={120} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
                        <Skeleton width={80} height={16} borderRadius={4} />
                    </View>
                </View>
                <Skeleton width={80} height={20} borderRadius={6} />
            </View>
        </View>
      </View>
    </View>
  );
}
