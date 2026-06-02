'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

// Aceita apenas paths internos ("/algo"). Rejeita URLs absolutas e "//host"
// (protocol-relative), que permitiriam redirecionar para fora do app.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

type FormValues = z.infer<typeof schema>;

// Credenciais de demonstração: exibidas apenas quando definidas via ambiente
// (ver .env.example). Nunca ficam hardcoded no código.
const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // só aceita caminho interno relativo; bloqueia open redirect (ex.: //evil.com, https://evil.com)
  const next = safeNext(searchParams.get('next'));
  const expired = searchParams.get('reason') === 'expired';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, router, next]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login(values);
      toast.success('Bem-vindo(a) ao painel');
      router.replace(next);
    } catch (err) {
      const message =
        (axios.isAxiosError(err) ? err.response?.data?.message : undefined) ??
        'Não foi possível entrar. Verifique e-mail e senha.';
      setSubmitError(message);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight" id="login-heading">
          Painel de acompanhamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Entre com suas credenciais pra acessar o painel.
        </p>
      </header>

      {expired && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-warning/40 bg-[color-mix(in_srgb,hsl(var(--warning))_12%,hsl(var(--card)))] p-3 text-sm text-warning-foreground dark:text-warning"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Sua sessão expirou. Faça login novamente para continuar.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-labelledby="login-heading"
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="tecnico@prefeitura.rio"
            autoComplete="username"
            autoFocus
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <button
              type="button"
              onClick={() =>
                toast.info(
                  'Entre em contato com o suporte da Prefeitura para redefinir sua senha.',
                )
              }
              className="text-xs font-medium text-primary transition-opacity hover:opacity-80 focus-ring rounded"
            >
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-[color-mix(in_srgb,hsl(var(--destructive))_12%,hsl(var(--card)))] p-3 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
        </Button>
      </form>

      {demoEmail && demoPassword && (
        <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-xs">
          <p className="font-medium text-foreground">Credenciais de teste</p>
          <p className="mt-1 font-mono text-muted-foreground">
            {demoEmail} / {demoPassword}
          </p>
        </div>
      )}
    </div>
  );
}
