'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/transactions', label: 'Movimientos' },
  { href: '/recurring', label: 'Recurrentes' },
];

/** Switches between the two pages under "Movimientos"; the desktop sidebar lists both instead. */
export function MovementsTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones de movimientos"
      className="bg-inset flex h-11 gap-0.5 rounded-xl p-1 sm:max-w-xs lg:hidden"
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`focus-ring flex flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors ${
              active
                ? 'bg-card text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
