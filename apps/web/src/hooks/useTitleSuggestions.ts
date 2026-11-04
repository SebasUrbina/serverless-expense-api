import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type TitleSuggestion = {
  title: string;
  type: 'expense' | 'income';
  category_id: number | null;
  category: string | null;
  category_icon: string | null;
  account_id: number | null;
  amount: number;
  uses: number;
};

const MIN_QUERY = 2;

export function useTitleSuggestions(query: string, type: string) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data } = useQuery({
    queryKey: ['transactions', 'suggestions', type, debounced.toLowerCase()],
    enabled: debounced.length >= MIN_QUERY,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: debounced, type });
      const res = await api.get<{ suggestions: TitleSuggestion[] }>(
        `/transactions/suggestions?${params}`,
        { signal },
      );
      return res.data.suggestions;
    },
  });
  return query.trim().length >= MIN_QUERY ? (data ?? []) : [];
}
