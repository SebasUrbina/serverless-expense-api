import { View, Text, TouchableOpacity, Animated, ScrollView } from "react-native";
import { PieChart, BarChart } from "react-native-gifted-charts";
import { useRef, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface DonutChartCardProps {
  pieData: any[];
  tagPieData: any[];
  barData: any[];
  totalSpent: number;
  legendEntries: [string, number][];
  tagLegendEntries: [string, number][];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  colorMap: Record<string, string>;
}

export function DonutChartCard({
  pieData,
  tagPieData,
  barData,
  totalSpent,
  legendEntries,
  tagLegendEntries,
  selectedCategory,
  setSelectedCategory,
  colorMap
}: DonutChartCardProps) {
  // Build quick lookup: category/tag → amount
  const categoriesAmountMap = Object.fromEntries(legendEntries);
  const tagsAmountMap = Object.fromEntries(tagLegendEntries);

  const [viewMode, setViewMode] = useState<"donut" | "bar">("donut");
  const [dataView, setDataView] = useState<"categories" | "tags">("categories");
  const [activeBarFilter, setActiveBarFilter] = useState<"all" | "income" | "expense">("all");

  // Fade animation for center label swap
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [selectedCategory]);

  // What to show in the center
  const activeAmountMap = dataView === "categories" ? categoriesAmountMap : tagsAmountMap;
  
  const centerLabel  = selectedCategory ?? "Total";
  const centerAmount = selectedCategory ? (activeAmountMap[selectedCategory] ?? 0) : totalSpent;
  
  // Tag palette is static (purple/orange), so if dataView is tags, grab from tagPieData directly
  const centerColor  = selectedCategory 
    ? (dataView === "categories" 
        ? (colorMap[selectedCategory] ?? "#8E8E93")
        : (tagPieData.find(t => t.text === selectedCategory)?.color ?? "#32ADE6")
      ) 
    : "#8E8E93";

  return (
    <View className="mx-4 mt-4 bg-[#1C1C1E] rounded-[24px] p-6">
      
      {/* ── View Toggle ── */}
      <View className="flex-row items-center justify-between mb-4">
        {viewMode === "donut" ? (
          <TouchableOpacity 
            onPress={() => {
              setDataView(dataView === "categories" ? "tags" : "categories");
              setSelectedCategory(null);
            }}
            className="flex-row items-center bg-[#2C2C2E] px-3 py-1.5 rounded-full"
          >
            <Text className="text-white font-medium text-sm mr-1">
              {dataView === "categories" ? "By Category" : "By Tags"}
            </Text>
            <Ionicons name="swap-horizontal" size={14} color="#8E8E93" />
          </TouchableOpacity>
        ) : (
          <Text className="text-white font-semibold text-lg">Monthly Trend</Text>
        )}
        <View className="flex-row bg-[#2C2C2E] rounded-full p-1">
          <TouchableOpacity
            onPress={() => setViewMode("donut")}
            className={`px-3 py-1.5 rounded-full ${viewMode === "donut" ? "bg-[#3A3A3C]" : ""}`}
          >
            <Text className={`text-xs font-medium ${viewMode === "donut" ? "text-white" : "text-[#8E8E93]"}`}>Donut</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("bar")}
            className={`px-3 py-1.5 rounded-full ${viewMode === "bar" ? "bg-[#3A3A3C]" : ""}`}
          >
            <Text className={`text-xs font-medium ${viewMode === "bar" ? "text-white" : "text-[#8E8E93]"}`}>Trend</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="items-center">
        {viewMode === "donut" ? (
          <View className="relative w-56 h-56 items-center justify-center">
            <PieChart
              data={dataView === "categories" ? pieData : tagPieData}
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
        ) : (
          <View className="w-full mt-2">
            {/* ── Bar Chart Legend ── */}
            <View className="flex-row justify-center mb-6">
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setActiveBarFilter(activeBarFilter === "income" ? "all" : "income")}
                className={`flex-row items-center mr-6 px-3 py-1.5 rounded-full ${activeBarFilter === "income" || activeBarFilter === "all" ? "bg-white/10" : "opacity-40"}`}
              >
                <View className="w-3 h-3 rounded-full bg-[#30D158] mr-2" />
                <Text className="text-white text-xs font-medium">Income</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setActiveBarFilter(activeBarFilter === "expense" ? "all" : "expense")}
                className={`flex-row items-center px-3 py-1.5 rounded-full ${activeBarFilter === "expense" || activeBarFilter === "all" ? "bg-white/10" : "opacity-40"}`}
              >
                <View className="w-3 h-3 rounded-full bg-[#FF453A] mr-2" />
                <Text className="text-white text-xs font-medium">Expense</Text>
              </TouchableOpacity>
            </View>

            <View className="h-[240px] items-center justify-center pl-2">
              {(() => {
                const formatCompact = (num: number) => {
                  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
                  if (num >= 1000) return (num / 1000).toFixed(0) + "k";
                  return String(num);
                };

                const filteredBarData = barData.filter((item: any) => {
                  if (activeBarFilter === "all") return true;
                  if (activeBarFilter === "income" && item.frontColor === "#30D158") return true;
                  if (activeBarFilter === "expense" && item.frontColor === "#FF453A") return true;
                  return false;
                }).map((item: any) => {
                  const out = { ...item };
                  const isFiltered = activeBarFilter !== "all";

                  if (isFiltered) {
                    out.spacing = 24;
                    out.label = item.monthLabel || "";
                  }

                  // When filtered, the bar is centered differently, so we reset the negative margin 
                  // to keep the label perfectly centered above it.
                  out.topLabelComponent = () => (
                    <View style={{ width: 18, alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
                      <Text 
                        style={{ 
                          color: item.frontColor, 
                          fontSize: 10, 
                          fontWeight: "700", 
                          width: 40,
                          textAlign: "center"
                        }}
                        numberOfLines={1}
                      >
                        {formatCompact(item.value)}
                      </Text>
                    </View>
                  );
                  return out;
                });

                const maxVal = Math.max(...filteredBarData.map((d: any) => d.value), 1000) * 1.15; // Extra headroom for labels

                return (
                  <BarChart
                    key={activeBarFilter}
                    data={filteredBarData}
                    barWidth={18}
                    initialSpacing={20}
                    spacing={24}
                    roundedTop
                    roundedBottom
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: "#8E8E93", fontSize: 11 }}
                    xAxisLabelTextStyle={{ color: "#8E8E93", fontSize: 11 }}
                    yAxisLabelWidth={45} 
                    formatYLabel={(label: string) => {
                      const num = Number(label);
                      if (isNaN(num)) return label;
                      return "$" + formatCompact(num);
                    }}
                    noOfSections={4}
                    maxValue={maxVal}
                    isAnimated
                    width={280}
                    rulesColor="#2C2C2E"
                    rulesType="dashed"
                    dashWidth={4}
                    dashGap={4}
                  />
                );
              })()}
            </View>
          </View>
        )}

        {/* Category legend — pressing here drives both center label AND slice pop */}
        {viewMode === "donut" && (
          <View className="w-full mt-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 12 }}>
              {(dataView === "categories" ? legendEntries : tagLegendEntries).map(([itemText]) => {
                const isActive = selectedCategory === itemText;
                const dotColor = dataView === "categories" 
                  ? (colorMap[itemText] || "#8E8E93")
                  : (tagPieData.find(t => t.text === itemText)?.color ?? "#32ADE6");
                  
                return (
                  <TouchableOpacity
                    key={itemText}
                    onPress={() => setSelectedCategory(isActive ? null : itemText)}
                    className={`flex-row items-center px-3 py-1.5 rounded-full ${isActive ? "bg-white/10 border border-white/20" : "bg-[#2C2C2E]"}`}
                  >
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: dotColor }}
                    />
                    <Text className={`text-sm font-medium ${isActive ? "text-white" : "text-[#8E8E93]"}`}>
                      {itemText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}
