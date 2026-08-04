'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Settings,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { ThemeToggle } from './ThemeToggle';

const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Movimientos', href: '/transactions', icon: Receipt },
  { name: 'Recurrentes', href: '/recurring', icon: Repeat },
  { name: 'Análisis', href: '/analytics', icon: PieChart },
  { name: 'Ajustes', href: '/settings', icon: Settings },
];

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
      <div className="theme-card flex h-screen w-64 flex-col border-r">
        {/* Logo */}
        <div className="theme-border flex h-16 items-center border-b px-6">
          <span className="theme-text text-xl font-black tracking-tighter">
            Seva
          </span>
          <span className="bg-accent-soft text-accent border-accent/20 ml-2 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest">
            WEB
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'theme-inset theme-text theme-border border'
                    : 'theme-muted hover:theme-inset hover:theme-text border border-transparent'
                }`}
              >
                <item.icon
                  className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-accent' : 'theme-subtle group-hover:theme-muted'}`}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme toggle + user */}
        <div className="theme-border shrink-0 space-y-2 border-t p-3">
          <div className="flex items-center justify-between px-1">
            <span className="theme-subtle text-xs font-semibold tracking-widest uppercase">
              Apariencia
            </span>
            <ThemeToggle compact />
          </div>

          <Link
            href="/settings"
            className="hover:theme-inset group hover:theme-border flex items-center gap-3 rounded-2xl border border-transparent p-2 transition-all"
          >
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="ring-border h-9 w-9 shrink-0 rounded-full object-cover ring-2"
              />
            ) : (
              <div className="theme-inset theme-muted theme-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-black">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="theme-text truncate text-sm font-bold">
                {displayName}
              </p>
              <p className="text-accent/80 truncate text-[11px] font-semibold tracking-wide uppercase">
                Ver perfil
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
