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
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 px-2 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <nav className="flex justify-around items-center relative">
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
                    className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-colors ${
                      isActive ? 'text-primary' : 'text-muted hover:text-secondary'
                    }`}
                  >
                    <item.icon
                      className={`h-6 w-6 mb-1 ${
                        isActive ? 'text-emerald-500' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-medium tracking-wide">
                      {item.name}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => openTransactionModal()}
                    className="flex flex-col items-center justify-center p-2 min-w-[64px] transition-transform active:scale-95 z-20"
                    aria-label="Agregar movimiento"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-1 absolute -top-5 border-4 border-card">
                      <Plus size={24} strokeWidth={2.5} className="rotate-0 transition-transform" />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide text-transparent select-none mt-7">
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
                className={`flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-secondary'
                }`}
              >
                <item.icon
                  className={`h-6 w-6 mb-1 ${
                    isActive ? 'text-emerald-500' : ''
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium tracking-wide">
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
