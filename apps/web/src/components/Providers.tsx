'use client';

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { applyTheme, useTheme } from '@/store/useTheme';
import { supabase } from '@/lib/supabase';
import { registerOfflineMutations } from '@/lib/offlineMutations';
import api from '@/lib/api';
import { loginHref, nextFromLocation } from '@/lib/loginRedirect';

const isDevelopment = process.env.NODE_ENV === 'development';
const QUERY_CACHE_KEY = 'SEVA_QUERY_CACHE';

// The persisted query cache holds financial data, so it must not survive a change of user.
function ClearCacheOnUserChange() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let currentUserId: string | null | undefined;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id ?? null;
      const userChanged =
        currentUserId !== undefined && currentUserId !== nextUserId;
      if (event === 'SIGNED_OUT' || userChanged) {
        queryClient.clear();
        window.localStorage.removeItem(QUERY_CACHE_KEY);
      }
      currentUserId = nextUserId;
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session && pathname !== '/login') {
      router.push(loginHref(pathname + window.location.search));
    } else if (!loading && session && pathname === '/login') {
      router.push(nextFromLocation());
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="border-accent h-8 w-8 animate-spin rounded-full border-t-2 border-r-2 border-r-transparent" />
      </div>
    );
  }

  if (!session && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // Own changes invalidate right away; other group members' shared expenses
          // also move personal totals, so those refresh within a minute.
          staleTime: 60 * 1000,
          gcTime: 1000 * 60 * 60 * 24, // 24 horas de tiempo de recolección para persistencia offline
        },
        mutations: {
          // Keep paused offline mutations long enough to be persisted and resumed.
          gcTime: 1000 * 60 * 60 * 24,
        },
      },
    });
    registerOfflineMutations(client, {
      create: async (payload) =>
        (await api.post('/transactions', payload)).data,
      update: async (id, payload) =>
        (await api.put(`/transactions/${id}`, payload)).data,
      remove: async (id) => (await api.delete(`/transactions/${id}`)).data,
    });
    return client;
  });

  const [persister] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: QUERY_CACHE_KEY,
    });
  });

  return (
    <AuthProvider>
      {persister ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24, // 24 horas
            buster: 'v1',
          }}
          onSuccess={() => void queryClient.resumePausedMutations()}
        >
          <ClearCacheOnUserChange />
          <ThemeProvider>
            <AuthGuard>{children}</AuthGuard>
          </ThemeProvider>
          {isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </PersistQueryClientProvider>
      ) : (
        <QueryClientProvider client={queryClient}>
          <ClearCacheOnUserChange />
          <ThemeProvider>
            <AuthGuard>{children}</AuthGuard>
          </ThemeProvider>
          {isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
      )}
    </AuthProvider>
  );
}
