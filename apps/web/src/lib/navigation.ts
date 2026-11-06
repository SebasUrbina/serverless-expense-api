import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Users,
  PieChart,
  Settings,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Other sections that live under this item in the mobile bar. */
  also?: string[];
  /** Shown below this item in the desktop sidebar. */
  children?: NavItem[];
};

export const mainNavigation: NavItem[] = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  {
    name: 'Movimientos',
    href: '/transactions',
    icon: Receipt,
    also: ['/recurring'],
    children: [{ name: 'Recurrentes', href: '/recurring', icon: Repeat }],
  },
  { name: 'Grupos', href: '/groups', icon: Users },
  { name: 'Análisis', href: '/analytics', icon: PieChart },
];

export const settingsNavigation: NavItem = {
  name: 'Ajustes',
  href: '/settings',
  icon: Settings,
};

export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export const isActiveItem = (pathname: string, item: NavItem) =>
  [item.href, ...(item.also ?? [])].some((href) =>
    isActivePath(pathname, href),
  );
