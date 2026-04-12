'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { useEffect } from 'react';
import { useUserSetup } from '@/hooks/usePreferences';
import { CreateTransactionModal } from './CreateTransactionModal';
import { useTransactionModal } from '@/store/useTransactionModal';
import { CreateRecurringModal } from './CreateRecurringModal';
import { useRecurringModal } from '@/store/useRecurringModal';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const { mutate: runSetup } = useUserSetup();
  const { isOpen, initialData, closeModal } = useTransactionModal();
  const { isOpen: isRecurringOpen, initialData: recurringInitialData, closeModal: closeRecurringModal } = useRecurringModal();

  useEffect(() => {
    if (!isLoginPage) {
      runSetup();
    }
  }, [isLoginPage, runSetup]);

  if (isLoginPage) {
    return (
      <main className="min-h-screen overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main
          className="flex-1 relative z-0 overflow-y-auto focus:outline-none lg:pb-0"
          style={{
            background: 'var(--bg-base)',
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
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
