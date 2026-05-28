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
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 focus-ring rounded-md">
          <Image
            src="/pcrj-logo.svg"
            alt="Prefeitura da Cidade do Rio de Janeiro"
            width={96}
            height={48}
            className="h-8 w-auto brightness-0 dark:invert"
            priority
          />
          <span className="hidden h-7 w-px bg-border sm:inline-block" aria-hidden="true" />
          <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:inline">
            Painel Social
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden h-9 gap-1.5 pl-2 pr-2 md:inline-flex"
                  aria-label="Menu do usuário"
                >
                  <UserCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
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
