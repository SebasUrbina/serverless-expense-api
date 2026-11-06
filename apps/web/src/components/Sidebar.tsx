'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import {
  isActiveItem,
  isActivePath,
  mainNavigation,
  settingsNavigation,
} from '@/lib/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    'Usuario';

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="hidden lg:flex lg:shrink-0">
      <div className="bg-card border-border flex h-screen w-60 flex-col border-r">
        <div className="flex h-16 items-center px-6">
          <span className="text-primary text-xl font-black tracking-tighter">
            Seva
          </span>
        </div>

        <nav
          aria-label="Navegación principal"
          className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2"
        >
          {[...mainNavigation, settingsNavigation].map((item) => (
            <div key={item.href} className="space-y-0.5">
              <SidebarLink
                item={item}
                // Sections with their own entry below highlight only that entry.
                active={
                  item.children
                    ? isActivePath(pathname, item.href)
                    : isActiveItem(pathname, item)
                }
              />
              {item.children?.map((child) => (
                <SidebarLink
                  key={child.href}
                  item={child}
                  active={isActivePath(pathname, child.href)}
                  nested
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-border flex shrink-0 items-center gap-2 border-t p-3">
          <Link
            href="/settings"
            className="hover:bg-inset focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors"
          >
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="bg-inset text-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {initials}
              </span>
            )}
            <span className="text-primary min-w-0 truncate text-sm font-semibold">
              {displayName}
            </span>
          </Link>
          <ThemeToggle compact />
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  nested = false,
}: {
  item: (typeof mainNavigation)[number];
  active: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`focus-ring flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
        nested ? 'ml-4 py-2' : 'py-2.5'
      } ${
        active
          ? 'bg-accent-soft text-accent'
          : 'text-secondary hover:bg-inset hover:text-primary'
      }`}
    >
      <item.icon
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        strokeWidth={active ? 2.5 : 2}
      />
      {item.name}
    </Link>
  );
}
