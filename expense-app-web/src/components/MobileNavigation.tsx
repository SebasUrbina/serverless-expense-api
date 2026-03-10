'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Receipt, Repeat, PieChart, Plus, ArrowRightLeft, CalendarClock, X } from 'lucide-react';
import { useTransactionModal } from '@/store/useTransactionModal';
import { useRecurringModal } from '@/store/useRecurringModal';

export const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { openModal: openTransactionModal } = useTransactionModal();
  const { openModal: openRecurringModal } = useRecurringModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* ── Add Action Menu Overlay ── */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden flex flex-col justify-end"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Select Type</h3>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  openTransactionModal();
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 transition-colors"
               >
                 <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                   <ArrowRightLeft size={18} className="text-emerald-500" />
                 </div>
                 <div className="text-left flex-1">
                   <p className="text-white font-semibold">One-time Transaction</p>
                   <p className="text-zinc-500 text-xs mt-0.5">Add a standard income or expense</p>
                 </div>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  openRecurringModal();
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 transition-colors"
               >
                 <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0">
                   <CalendarClock size={18} className="text-violet-500" />
                 </div>
                 <div className="text-left flex-1">
                   <p className="text-white font-semibold">Recurring Expense</p>
                   <p className="text-zinc-500 text-xs mt-0.5">Set up an automated schedule</p>
                 </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Navigation Bar ── */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-zinc-800 z-50 px-2 pt-2"
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
                      isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
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
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center justify-center p-2 min-w-[64px] transition-transform active:scale-95 z-20"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-1 absolute -top-5 border-4 border-zinc-950">
                      <Plus size={24} strokeWidth={2.5} className={isMenuOpen ? "rotate-45" : "rotate-0 transition-transform"} />
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
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
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
