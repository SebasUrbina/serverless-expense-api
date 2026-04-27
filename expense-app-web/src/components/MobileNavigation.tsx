"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Repeat, PieChart, Plus } from "lucide-react";
import { useTransactionModal } from "@/store/useTransactionModal";

export const navigation = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Movimientos", href: "/transactions", icon: Receipt },
  { name: "Recurrentes", href: "/recurring", icon: Repeat },
  { name: "Análisis", href: "/analytics", icon: PieChart },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { openModal: openTransactionModal } = useTransactionModal();
  return (
    <>
      {/* ── Bottom Navigation Bar ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pt-2 pb-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <nav className="flex justify-around items-center relative theme-card backdrop-blur-xl border theme-border rounded-3xl shadow-elevated px-2 py-1 mx-auto max-w-sm">
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
                    className={`flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "text-emerald-500 scale-105 drop-shadow-sm"
                        : "theme-muted hover:theme-text hover:scale-105"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 mb-1 transition-colors duration-300 ${
                        isActive ? "text-emerald-500" : ""
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
                    className="flex flex-col items-center justify-center p-2 min-w-[64px] transition-transform active:scale-90 z-20 group"
                    aria-label="Agregar movimiento"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg group-hover:shadow-xl mb-1 absolute -top-6 border-[3px] theme-border theme-bg transition-all duration-300">
                      <Plus
                        size={26}
                        strokeWidth={2.5}
                        className="rotate-0 transition-transform group-hover:rotate-90 duration-300"
                      />
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
                className={`flex flex-col items-center p-2 min-w-[64px] rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "text-emerald-500 scale-105 drop-shadow-sm"
                    : "theme-muted hover:theme-text hover:scale-105"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mb-1 transition-colors duration-300 ${
                    isActive ? "text-emerald-500" : ""
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
