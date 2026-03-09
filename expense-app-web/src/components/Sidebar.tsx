'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, Repeat, Settings, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navigationConst = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="hidden lg:flex lg:shrink-0">
      <div className="flex flex-col w-64 border-r border-zinc-800 bg-black h-screen">
        <div className="flex items-center h-16 px-6 bg-black">
          <span className="text-2xl font-bold tracking-tight text-white">Seva</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">WEB</span>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-4 space-y-1 bg-black">
            {navigationConst.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 mr-3 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User Profile View */}
        <div className="shrink-0 flex border-t border-zinc-800 p-4">
          <Link href="/settings" className="shrink-0 w-full group block">
            <div className="flex items-center">
              {user?.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="inline-block h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold uppercase shrink-0">
                  {user?.email?.[0] || 'U'}
                </div>
              )}
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email || 'User'}
                </p>
                <p className="text-xs font-medium text-zinc-500 group-hover:text-zinc-400">View profile</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
