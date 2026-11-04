'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTransactionModal } from '@/store/useTransactionModal';
import { isActivePath, mainNavigation } from '@/lib/navigation';

function NavLink({
  item,
  active,
}: {
  item: (typeof mainNavigation)[number];
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`focus-ring flex min-w-[64px] flex-col items-center gap-1 rounded-2xl p-2 text-[11px] font-medium transition-colors ${
        active ? 'text-accent' : 'text-secondary hover:text-primary'
      }`}
    >
      <item.icon
        className="h-5 w-5"
        aria-hidden="true"
        strokeWidth={active ? 2.5 : 2}
      />
      {item.name}
    </Link>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const { openModal } = useTransactionModal();
  const [first, second, ...rest] = mainNavigation;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 px-4 pt-2 lg:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <nav
        aria-label="Navegación principal"
        className="bg-card border-border shadow-elevated mx-auto flex max-w-sm items-center justify-around rounded-3xl border px-2 py-1"
      >
        {[first, second].map(
          (item) =>
            item && (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            ),
        )}
        <button
          type="button"
          onClick={() => openModal()}
          aria-label="Agregar movimiento"
          className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors"
        >
          <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
        </button>
        {rest.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href)}
          />
        ))}
      </nav>
    </div>
  );
}
