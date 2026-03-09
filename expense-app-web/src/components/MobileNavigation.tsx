'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Repeat, Settings, PieChart } from 'lucide-react';

export const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-zinc-800 z-50 px-2 pb-safe pt-2">
      <nav className="flex justify-around items-center">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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
  );
}
