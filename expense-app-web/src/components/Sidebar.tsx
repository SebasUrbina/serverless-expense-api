'use client';

import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, Repeat, Settings, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email || 'Usuario';

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="hidden lg:flex lg:shrink-0">
      <div
        className="flex flex-col w-64 h-screen"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Seva
          </span>
          <span
            className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider"
            style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            WEB
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-2xl transition-all"
                style={{
                  background: isActive ? 'var(--bg-inset)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <item.icon
                  className="flex-shrink-0 mr-3 h-4 w-4 transition-colors"
                  style={{ color: isActive ? '#10b981' : 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme toggle + user */}
        <div className="shrink-0 p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Apariencia</span>
            <ThemeToggle compact />
          </div>

          <Link href="/settings" className="flex items-center gap-3 p-2 rounded-2xl transition-all hover:opacity-80 group">
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                Ver perfil
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
