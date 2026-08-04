'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Repeat, PieChart, Plus } from 'lucide-react';
import { useTransactionModal } from '@/store/useTransactionModal';

export const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Movimientos', href: '/transactions', icon: Receipt },
  { name: 'Recurrentes', href: '/recurring', icon: Repeat },
  { name: 'Análisis', href: '/analytics', icon: PieChart },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { openModal: openTransactionModal } = useTransactionModal();
  return (
    <>
      {/* ── Bottom Navigation Bar ── */}
      <div
        className="fixed right-0 bottom-0 left-0 z-50 px-4 pt-2 pb-6 lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <nav className="theme-card theme-border shadow-elevated relative mx-auto flex max-w-sm items-center justify-around rounded-3xl border px-2 py-1 backdrop-blur-xl">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;

            // Insert the Add Button right into the middle of the row visually
            // (assuming 4 items, index 1 is the 2nd item. We render 2 items, the Add button, then the rest)
            if (index === 1) {
              return (
                <div key="add-button-container" className="contents">
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex min-w-[64px] flex-col items-center rounded-2xl p-2 transition-all duration-300 ${
                      isActive
                        ? 'text-accent scale-105'
                        : 'theme-muted hover:theme-text hover:scale-105'
                    }`}
                  >
                    <item.icon
                      className={`mb-1 h-5 w-5 transition-colors duration-300 ${
                        isActive ? 'text-accent' : ''
                      }`}
                      aria-hidden="true"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="text-[10px] font-semibold tracking-wide">
                      {item.name}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => openTransactionModal()}
                    className="group z-20 flex min-w-[64px] flex-col items-center justify-center p-2 transition-transform active:scale-90"
                    aria-label="Agregar movimiento"
                  >
                    <div className="theme-border theme-bg absolute -top-6 mb-1 flex h-14 w-14 items-center justify-center rounded-full border-[3px] bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md transition-all duration-300 group-hover:shadow-lg">
                      <Plus
                        size={26}
                        strokeWidth={2.5}
                        className="rotate-0 transition-transform duration-300 group-hover:rotate-90"
                      />
                    </div>
                    <span className="mt-7 text-[10px] font-medium tracking-wide text-transparent select-none">
                      Add
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex min-w-[64px] flex-col items-center rounded-2xl p-2 transition-all duration-300 ${
                  isActive
                    ? 'text-accent scale-105'
                    : 'theme-muted hover:theme-text hover:scale-105'
                }`}
              >
                <item.icon
                  className={`mb-1 h-5 w-5 transition-colors duration-300 ${
                    isActive ? 'text-accent' : ''
                  }`}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-semibold tracking-wide">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
