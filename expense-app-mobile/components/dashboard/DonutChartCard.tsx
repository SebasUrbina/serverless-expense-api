import { View, Text, TouchableOpacity, Animated } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useRef, useEffect } from "react";

interface DonutChartCardProps {
  pieData: any[];
  totalSpent: number;
  legendEntries: [string, number][];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  colorMap: Record<string, string>;
}

export function DonutChartCard({
  pieData,
  totalSpent,
  legendEntries,
  selectedCategory,
  setSelectedCategory,
  colorMap
}: DonutChartCardProps) {
  // Build quick lookup: category → amount
  const amountMap = Object.fromEntries(legendEntries);



  // Fade animation for center label swap
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [selectedCategory]);

  // What to show in the center
  const centerLabel  = selectedCategory ?? "Total";
  const centerAmount = selectedCategory ? (amountMap[selectedCategory] ?? 0) : totalSpent;
  const centerColor  = selectedCategory ? (colorMap[selectedCategory] ?? "#8E8E93") : "#8E8E93";

  return (
    <View className="mx-4 mt-4 bg-[#1C1C1E] rounded-[24px] p-6">
      <View className="items-center">
        <View className="relative w-56 h-56 items-center justify-center">
          <PieChart
            data={pieData}
            donut
            radius={100}
            innerRadius={70}
            innerCircleColor="#1C1C1E"
            centerLabelComponent={() => (
              <Animated.View
                className="items-center justify-center"
                style={{ width: 128, opacity: fadeAnim }}
              >
                <Text
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: centerColor }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {centerLabel}
                </Text>
                <Text
                  className="text-2xl font-extrabold text-white tracking-tight"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  ${centerAmount.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                </Text>
              </Animated.View>
            )}
          />
        </View>

        {/* Category legend — pressing here drives both center label AND slice pop */}
        <View className="flex-row flex-wrap justify-center mt-6 gap-y-3">
          {legendEntries.map(([cat]) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(isActive ? null : cat)}
                className={`flex-row items-center mr-6 px-2.5 py-1 rounded-full ${isActive ? "bg-white/10" : ""}`}
              >
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colorMap[cat] || "#8E8E93" }}
                />
                <Text className={`text-sm font-medium ${isActive ? "text-white" : "text-[#8E8E93]"}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
