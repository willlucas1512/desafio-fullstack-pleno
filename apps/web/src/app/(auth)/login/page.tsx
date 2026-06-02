import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar — Painel PCRJ',
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen xl:grid-cols-2">
      {/* Brand pane (desktop) */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground xl:flex xl:flex-col xl:p-12">
        {/* decoração de fundo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/30 to-transparent"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pao-de-acucar.png" alt="" className="w-full opacity-20 brightness-0 invert" />
        </div>

        <div className="relative flex items-center gap-3">
          <Image
            src="/pcrj-logo.svg"
            alt="Prefeitura da Cidade do Rio de Janeiro"
            width={220}
            height={110}
            priority
            className="h-auto w-40 brightness-0 invert"
          />
          <span className="flex flex-col border-l border-primary-foreground/25 pl-3 leading-tight">
            <span className="text-xl font-bold tracking-tight">Painel Social</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              Acompanhamento
            </span>
          </span>
        </div>

        <div className="relative flex max-w-md flex-1 flex-col justify-center space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Proteção à infância
          </p>
          <p className="text-3xl font-semibold leading-tight md:text-4xl">
            Painel de Acompanhamento Infantil
          </p>
          <p className="text-base leading-relaxed text-primary-foreground/80">
            Crianças em situação de vulnerabilidade, com dados de saúde, educação e
            assistência social.
          </p>
        </div>
      </aside>

      {/* Form pane */}
      <section className="relative isolate flex flex-col overflow-hidden bg-background bg-[url('/bg-servicos.png')] bg-repeat dark:bg-none">
        {/* header mobile com mini-logo */}
        <header className="flex items-center gap-2.5 border-b bg-primary px-6 py-4 text-primary-foreground sm:px-10 xl:hidden">
          <Image
            src="/pcrj-logo.svg"
            alt="Prefeitura da Cidade do Rio de Janeiro"
            width={96}
            height={48}
            priority
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="flex flex-col border-l border-primary-foreground/25 pl-2.5 leading-tight">
            <span className="text-sm font-bold tracking-tight">Painel Social</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">
              Acompanhamento
            </span>
          </span>
        </header>

        {/* skyline decorativo (mobile) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 xl:hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pao-de-acucar.png"
            alt=""
            className="block w-full translate-y-[6.6%] opacity-[0.08] brightness-0"
          />
        </div>

        <div className="flex items-start justify-center p-6 pt-10 sm:p-10 xl:flex-1 xl:items-center">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <footer className="px-6 pb-6 sm:px-10">
          <p className="mx-auto w-full max-w-sm text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Prefeitura da Cidade do Rio de Janeiro
          </p>
        </footer>
      </section>
    </main>
  );
}
