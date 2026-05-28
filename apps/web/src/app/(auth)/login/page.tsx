import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar — Painel PCRJ',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-primary/5 via-background to-muted/40 p-4 pt-16 md:pt-24">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
