'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { useEffect, useRef, useCallback } from 'react';
import { useUserSetup } from '@/hooks/usePreferences';
import { CreateTransactionModal } from './CreateTransactionModal';
import { useTransactionModal } from '@/store/useTransactionModal';
import { CreateRecurringModal } from './CreateRecurringModal';
import { useRecurringModal } from '@/store/useRecurringModal';
import { PullToRefresh } from './PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const { mutate: runSetup } = useUserSetup();
  const setupRan = useRef(false);
  const { isOpen, initialData, closeModal } = useTransactionModal();
  const {
    isOpen: isRecurringOpen,
    initialData: recurringInitialData,
    closeModal: closeRecurringModal,
  } = useRecurringModal();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    if (!isLoginPage && !setupRan.current) {
      setupRan.current = true;
      runSetup();
    }
  }, [isLoginPage, runSetup]);

  if (isLoginPage) {
    return (
      <main className="theme-bg theme-text min-h-dvh overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="theme-bg theme-text flex h-dvh min-h-dvh overflow-hidden selection:bg-emerald-500/30">
      <Sidebar />
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <main
          className="relative z-0 flex-1 overflow-y-auto overscroll-none scroll-smooth focus:outline-none lg:pb-0"
          style={{
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
          }}
        >
          <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>
        </main>
      </div>
      <MobileNavigation />
      {isOpen ? (
        <CreateTransactionModal
          isOpen={isOpen}
          initialData={initialData}
          onClose={closeModal}
        />
      ) : null}
      {isRecurringOpen ? (
        <CreateRecurringModal
          isOpen={isRecurringOpen}
          initialData={recurringInitialData}
          onClose={closeRecurringModal}
        />
      ) : null}
    </div>
  );
}
