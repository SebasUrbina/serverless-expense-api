"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Settings,
  PieChart,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Movimientos", href: "/transactions", icon: Receipt },
  { name: "Recurrentes", href: "/recurring", icon: Repeat },
  { name: "Análisis", href: "/analytics", icon: PieChart },
  { name: "Ajustes", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    "Usuario";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="hidden lg:flex lg:shrink-0">
      <div className="flex flex-col w-64 h-screen theme-card border-r">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b theme-border">
          <span className="text-xl font-black tracking-tighter theme-text">
            Seva
          </span>
          <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
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
                className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "theme-inset theme-text border theme-border shadow-inner"
                    : "theme-muted hover:theme-inset hover:theme-text border border-transparent"
                }`}
              >
                <item.icon
                  className={`flex-shrink-0 mr-3 h-4 w-4 transition-colors duration-300 ${isActive ? "text-emerald-500" : "theme-subtle group-hover:theme-muted"}`}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme toggle + user */}
        <div className="shrink-0 p-3 space-y-2 border-t theme-border">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold theme-subtle uppercase tracking-widest">
              Apariencia
            </span>
            <ThemeToggle compact />
          </div>

          <Link
            href="/settings"
            className="flex items-center gap-3 p-2 rounded-2xl transition-all hover:theme-inset group border border-transparent hover:theme-border"
          >
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-border"
              />
            ) : (
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 theme-inset theme-muted border theme-border">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate theme-text">
                {displayName}
              </p>
              <p className="text-[11px] font-semibold tracking-wide uppercase truncate text-emerald-500/80">
                Ver perfil
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
