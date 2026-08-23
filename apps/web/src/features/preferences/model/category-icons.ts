export type CategoryIconGroup = {
  label: string;
  icons: readonly string[];
};

export const CATEGORY_ICON_GROUPS: readonly CategoryIconGroup[] = [
  {
    label: 'Frecuentes',
    icons: ['🛒', '🍽️', '🚗', '🏠', '💡', '💳', '💰', '🎁'],
  },
  {
    label: 'Comida',
    icons: ['🍔', '🍕', '☕', '🥦', '🍺', '🍎', '🥐', '🛵'],
  },
  {
    label: 'Transporte',
    icons: ['🚙', '🚌', '🚇', '✈️', '⛽', '🚲', '🚕', '🅿️'],
  },
  {
    label: 'Hogar y servicios',
    icons: ['🛋️', '🔧', '🧹', '📱', '🌐', '🔥', '💧', '🔑'],
  },
  {
    label: 'Salud y bienestar',
    icons: ['💊', '🏥', '🩺', '🏋️', '🧘', '🦷', '👓', '❤️'],
  },
  {
    label: 'Ocio y compras',
    icons: ['🎮', '🎬', '🎵', '📚', '⚽', '👕', '💻', '🐾'],
  },
  {
    label: 'Ingresos y finanzas',
    icons: ['💵', '💼', '📈', '🏦', '🎯', '🪙', '🧾', '💸'],
  },
] as const;

const emojiPattern = /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u;

export function isSingleEmoji(value: string): boolean {
  const trimmedValue = value.trim();
  if (!trimmedValue || !emojiPattern.test(trimmedValue)) return false;

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return [...segmenter.segment(trimmedValue)].length === 1;
}
