'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { useEffect } from 'react';
import { useUserSetup } from '@/hooks/usePreferences';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const { mutate: runSetup } = useUserSetup();

  useEffect(() => {
    if (!isLoginPage) {
      runSetup();
    }
  }, [isLoginPage, runSetup]);

  if (isLoginPage) {
    return <main className="flex-1 h-screen overflow-hidden bg-zinc-950">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-zinc-950 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
