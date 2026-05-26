'use client';

import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/children', label: 'Crianças' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-2">
        <Link href="/dashboard" className="mr-2 flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">Painel PCRJ</span>
        </Link>

        <nav className="ml-2 hidden gap-1 md:flex" aria-label="Navegação principal">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-ring',
                  active && 'bg-accent text-accent-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {user && (
            <span className="hidden text-sm text-muted-foreground md:inline" aria-live="polite">
              {user.preferred_username}
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="hidden md:inline-flex"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          className="container space-y-1 border-t py-2 md:hidden"
          aria-label="Navegação móvel"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-ring',
                  active && 'bg-accent',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          {user && (
            <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              Conectado como {user.preferred_username}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start gap-2 text-sm"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </nav>
      )}
    </header>
  );
}
