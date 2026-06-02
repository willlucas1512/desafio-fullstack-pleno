'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { MobileNav } from './mobile-nav';
import { NAV, isActivePath } from './nav-items';
import { UserMenu } from './user-menu';

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
            const active = isActivePath(pathname, item.href);
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
          {user && <UserMenu username={user.preferred_username} onLogout={logout} />}
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
        <MobileNav
          pathname={pathname}
          username={user?.preferred_username}
          onNavigate={() => setOpen(false)}
          onLogout={logout}
        />
      )}
    </header>
  );
}
