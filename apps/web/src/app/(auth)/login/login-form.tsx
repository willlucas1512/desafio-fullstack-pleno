'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, KeyRound, Landmark, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const next = searchParams.get('next') ?? '/dashboard';
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
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Não foi possível entrar. Verifique e-mail e senha.';
      setSubmitError(message);
    }
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden border-t-4 border-t-primary shadow-lg">
      <CardHeader className="space-y-3 pb-4 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Landmark className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Painel de acompanhamento</CardTitle>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Prefeitura da Cidade do Rio de Janeiro
          </p>
        </div>
        <CardDescription className="!mt-2 text-sm">
          Use suas credenciais cadastradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expired && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>Sua sessão expirou. Faça login novamente para continuar.</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    'Entre em contato com o suporte da SMAS para redefinir sua senha.',
                  )
                }
                className="text-xs text-muted-foreground transition-colors hover:text-foreground focus-ring rounded"
              >
                Esqueci minha senha
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          {submitError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
          </Button>
        </form>
        <div className="mt-6 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-center text-xs">
          <p className="font-medium text-foreground">Credenciais de teste</p>
          <p className="mt-1 font-mono text-muted-foreground">
            tecnico@prefeitura.rio / painel@2024
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
