// ── Dynamic color & icon palette ──
// Colors rotate for any number of categories
export const COLOR_PALETTE = [
  "#32D74B", // iOS Green
  "#0A84FF", // iOS Blue
  "#FFD60A", // iOS Yellow
  "#BF5AF2", // iOS Purple
  "#FF9F0A", // iOS Orange
  "#FF375F", // iOS Pink
  "#64D2FF", // iOS Teal
  "#AC8E68", // iOS Brown
];

export const ICON_PALETTE: string[] = [
  "restaurant",
  "car",
  "cart",
  "pricetag",
  "home",
  "medical",
  "game-controller",
  "airplane",
];

export const FALLBACK_COLOR = "#8E8E93";

// Build color/icon assignments on-the-fly from unique categories
export function buildCategoryMeta(categories: string[]) {
  const colorMap: Record<string, string> = {};
  const iconMap: Record<string, string> = {};
  categories.forEach((cat, i) => {
    colorMap[cat] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    iconMap[cat] = ICON_PALETTE[i % ICON_PALETTE.length];
  });
  return { colorMap, iconMap };
}
