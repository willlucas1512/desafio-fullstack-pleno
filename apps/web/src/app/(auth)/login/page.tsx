import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar — Painel PCRJ',
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand pane (desktop) */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* decoração de fundo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/30 to-transparent"
        />

        <div className="relative">
          <Image
            src="/pcrj-logo.svg"
            alt="Prefeitura da Cidade do Rio de Janeiro"
            width={220}
            height={110}
            priority
            className="h-auto w-44 brightness-0 invert"
          />
        </div>

        <div className="relative max-w-md space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Acompanhamento social
          </p>
          <p className="text-3xl font-semibold leading-tight md:text-4xl">
            Identifique alertas e priorize quem precisa de atenção agora.
          </p>
          <p className="text-base leading-relaxed text-primary-foreground/80">
            Painel que cruza dados de saúde, educação e assistência social das crianças
            acompanhadas pela Prefeitura. Pensado para ser usado em campo, no celular ou
            num computador simples.
          </p>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Prefeitura da Cidade do Rio de Janeiro
        </p>
      </aside>

      {/* Form pane */}
      <section className="flex flex-col bg-background">
        {/* header mobile com mini-logo */}
        <header className="border-b bg-primary px-4 py-4 lg:hidden">
          <Image
            src="/pcrj-logo.svg"
            alt="Prefeitura da Cidade do Rio de Janeiro"
            width={130}
            height={65}
            priority
            className="h-9 w-auto brightness-0 invert"
          />
        </header>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
