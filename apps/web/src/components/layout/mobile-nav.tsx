'use client';

import { LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAV, THEME_OPTIONS, isActivePath } from './nav-items';

interface Props {
  pathname: string | null;
  username?: string;
  onNavigate: () => void;
  onLogout: () => void;
}

/** Painel de navegação móvel: links, sair e seletor de tema. */
export function MobileNav({ pathname, username, onNavigate, onLogout }: Props) {
  const { setTheme, theme } = useTheme();

  return (
    <nav
      id="mobile-nav"
      className="container space-y-1.5 border-t border-white/15 py-4 md:hidden"
      aria-label="Navegação móvel"
    >
      {username && (
        <p className="mb-1.5 border-b border-white/15 px-3 pb-3 text-xs text-primary-foreground/60">
          Conectado como {username}
        </p>
      )}
      {NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'block rounded-md px-3 py-2.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground focus-ring',
              active && 'bg-brand text-brand-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      <Button
        variant="ghost"
        onClick={onLogout}
        className="w-full justify-start gap-2 text-sm text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
      >
        <LogOut className="h-4 w-4" /> Sair
      </Button>
      <div className="mt-4 border-t border-white/15 pt-4">
        <p className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-primary-foreground/60">
          Tema
        </p>
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-ring',
                theme === value
                  ? 'bg-white/15 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
