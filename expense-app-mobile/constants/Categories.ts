// ── Predefined Dictionary ──
export const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  // Common Expenses
  "Food": { color: "#FF375F", icon: "restaurant" },
  "Transport": { color: "#0A84FF", icon: "car" },
  "Housing": { color: "#BF5AF2", icon: "home" },
  "Shopping": { color: "#FF9F0A", icon: "cart" },
  "Entertainment": { color: "#FFD60A", icon: "game-controller" },
  "Health": { color: "#32D74B", icon: "medical" },
  "Travel": { color: "#64D2FF", icon: "airplane" },
  "Utilities": { color: "#AC8E68", icon: "flash" },
  "Education": { color: "#5E5CE6", icon: "book" },
  
  // Common Income
  "Salary": { color: "#30D158", icon: "cash" },
  "Freelance": { color: "#32ADE6", icon: "laptop" },
  "Investment": { color: "#BF5AF2", icon: "trending-up" },
  "Gift": { color: "#FF375F", icon: "gift" },
};

export const FALLBACK_COLOR = "#8E8E93";
export const FALLBACK_ICON = "pricetag";

// Backward compatible lookup for dynamic UI features
// For any unknown category in the DB, falls back to gray tag
export function buildCategoryMeta(categories: string[]) {
  const colorMap: Record<string, string> = {};
  const iconMap: Record<string, string> = {};
  
  categories.forEach((cat) => {
    const meta = CATEGORY_META[cat];
    colorMap[cat] = meta ? meta.color : FALLBACK_COLOR;
    iconMap[cat] = meta ? meta.icon : FALLBACK_ICON;
  });
  
  return { colorMap, iconMap };
}
