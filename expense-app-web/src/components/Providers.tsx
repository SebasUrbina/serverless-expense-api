'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
      </div>
    );
  }

  // If unauthenticated and not on login page, render nothing while redirecting
  if (!session && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          {children}
        </AuthGuard>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  );
}
