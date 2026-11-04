import {
  LayoutDashboard,
  Receipt,
  Repeat,
  PieChart,
  Settings,
} from 'lucide-react';

export const mainNavigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Movimientos', href: '/transactions', icon: Receipt },
  { name: 'Recurrentes', href: '/recurring', icon: Repeat },
  { name: 'Análisis', href: '/analytics', icon: PieChart },
];

export const settingsNavigation = {
  name: 'Ajustes',
  href: '/settings',
  icon: Settings,
};

export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);
