export const CATEGORY_PALETTE = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
];
export const OTHERS_COLOR = 'var(--border)';

/**
 * Gives each category a stable palette slot from its position among the
 * user's categories (by id), so a category keeps its color on every screen.
 */
export function buildCategoryColors(categoryIds: number[]) {
  const sorted = [...new Set(categoryIds)].sort((a, b) => a - b);
  const colors = new Map<number, string>();
  sorted.forEach((id, i) => {
    colors.set(id, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]!);
  });
  return colors;
}

/**
 * Colors for a set of categories shown together (a stacked bar or chart):
 * keeps each stable color unless an earlier entry already took it.
 */
export function distinctCategoryColors(
  ids: (number | null | undefined)[],
  colors: Map<number, string>,
) {
  const used = new Set<string>();
  return ids.map((id) => {
    const preferred = id == null ? undefined : colors.get(id);
    const color =
      preferred && !used.has(preferred)
        ? preferred
        : (CATEGORY_PALETTE.find((c) => !used.has(c)) ?? OTHERS_COLOR);
    used.add(color);
    return color;
  });
}
