'use client';

import { ChevronDown, LogOut, Menu, Monitor, Moon, Sun, UserCircle, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/children', label: 'Crianças' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-sm print:hidden">
      <div aria-hidden="true" className="h-1 w-full bg-brand" />
      <div className="container flex h-16 items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 focus-ring rounded-md">
          <Image
            src="/pcrj-logo.svg"
            alt="Prefeitura da Cidade do Rio de Janeiro"
            width={96}
            height={48}
            className="h-7 w-auto brightness-0 invert"
            priority
          />
          <span className="hidden flex-col border-l border-primary-foreground/25 pl-2.5 leading-tight sm:flex">
            <span className="text-[15px] font-bold tracking-tight">Painel Social</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">
              Acompanhamento
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden gap-1 md:flex" aria-label="Navegação principal">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground focus-ring',
                  active && 'bg-brand text-brand-foreground hover:bg-brand hover:text-brand-foreground',
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden h-9 gap-1.5 pl-2 pr-2 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground md:inline-flex"
                  aria-label="Menu do usuário"
                >
                  <UserCircle className="h-5 w-5 text-primary-foreground/80" aria-hidden="true" />
                  <span className="text-sm">{user.preferred_username}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground">Conectado como</p>
                  <p className="truncate text-sm font-medium">{user.preferred_username}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                  Tema
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" /> Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" /> Escuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" /> Sistema
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground md:hidden"
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
          className="container space-y-1.5 border-t border-white/15 py-4 md:hidden"
          aria-label="Navegação móvel"
        >
          {user && (
            <p className="mb-1.5 border-b border-white/15 px-3 pb-3 text-xs text-primary-foreground/60">
              Conectado como {user.preferred_username}
            </p>
          )}
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
            onClick={logout}
            className="w-full justify-start gap-2 text-sm text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
          <div className="mt-4 border-t border-white/15 pt-4">
            <p className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-primary-foreground/60">
              Tema
            </p>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(
                [
                  { value: 'light', label: 'Claro', icon: Sun },
                  { value: 'dark', label: 'Escuro', icon: Moon },
                  { value: 'system', label: 'Sistema', icon: Monitor },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
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
      )}
    </header>
  );
}
