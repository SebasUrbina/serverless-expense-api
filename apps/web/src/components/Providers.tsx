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
      router.push('/login');
    } else if (!loading && session && pathname === '/login') {
      router.push('/');
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
      </div>
    );
  }

  if (!session && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data only changes through this app's own mutations (which invalidate) and the daily cron.
            staleTime: 5 * 60 * 1000,
            gcTime: 1000 * 60 * 60 * 24, // 24 horas de tiempo de recolección para persistencia offline
          },
        },
      }),
  );

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
