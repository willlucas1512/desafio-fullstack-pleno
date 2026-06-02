import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';

export const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/children', label: 'Crianças' },
];

export const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon }[] =
  [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

export function isActivePath(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}
