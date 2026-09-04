'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthProvider';
import type { MonthlyAvailability } from '@/types/api';

export function useAvailability(month: string) {
  const { session } = useAuth();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  useEffect(() => {
    const timer = setInterval(
      () => setToday(format(new Date(), 'yyyy-MM-dd')),
      60_000,
    );
    return () => clearInterval(timer);
  }, []);
  return useQuery({
    queryKey: [
      'transactions',
      'availability',
      session?.user.id,
      month,
      timezone,
      today,
    ],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        availability: MonthlyAvailability;
      }>('/transactions/summary/availability', { params: { month, timezone } });
      return response.data.availability;
    },
    refetchInterval: 60_000,
  });
}
