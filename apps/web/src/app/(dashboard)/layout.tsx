'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true;
      return;
    }
    if (status === 'unauthenticated') {
      const params = new URLSearchParams();
      // sessão expirou com a página aberta -> sinaliza para o login exibir o aviso
      if (wasAuthenticated.current) params.set('reason', 'expired');
      if (typeof window !== 'undefined') {
        params.set('next', window.location.pathname + window.location.search);
      }
      const query = params.toString();
      router.replace(query ? `/login?${query}` : '/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Verificando sessão"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Pular para o conteúdo
      </a>
      <AppHeader />
      <main id="conteudo" tabIndex={-1} className="container flex-1 py-6 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
