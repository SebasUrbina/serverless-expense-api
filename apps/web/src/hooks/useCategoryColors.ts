import { useMemo } from 'react';
import { buildCategoryColors } from '@/lib/categoryColors';
import { useCategories } from './usePreferences';

export function useCategoryColors() {
  const { data } = useCategories();
  return useMemo(
    () => buildCategoryColors((data?.categories ?? []).map((c) => c.id)),
    [data],
  );
}
