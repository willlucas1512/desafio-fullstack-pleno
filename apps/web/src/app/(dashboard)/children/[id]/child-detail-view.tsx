'use client';

import axios from 'axios';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Loader2,
  Printer,
  Share2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChildAvatar } from '@/components/children/child-avatar';
import { EducationCard } from '@/components/children/education-card';
import { HealthCard } from '@/components/children/health-card';
import { SocialCard } from '@/components/children/social-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChild, useReviewChild } from '@/hooks/use-children';
import { ageInYears, formatDateBR, formatDateTimeBR } from '@/lib/format';
import type { Child } from '@/lib/types';
import { cn } from '@/lib/utils';

type Priority = 'critico' | 'atencao' | 'monitorar' | 'sem_dados' | 'ok';

function getPriority(child: Child): { level: Priority; alertCount: number; areasWithAlerts: number } {
  const alertCount =
    (child.saude?.alertas.length ?? 0) +
    (child.educacao?.alertas.length ?? 0) +
    (child.assistencia_social?.alertas.length ?? 0);
  const areasWithAlerts =
    (child.saude && child.saude.alertas.length > 0 ? 1 : 0) +
    (child.educacao && child.educacao.alertas.length > 0 ? 1 : 0) +
    (child.assistencia_social && child.assistencia_social.alertas.length > 0 ? 1 : 0);
  const noData =
    child.saude === null && child.educacao === null && child.assistencia_social === null;

  let level: Priority = 'ok';
  if (areasWithAlerts === 3) level = 'critico';
  else if (areasWithAlerts === 2) level = 'atencao';
  else if (areasWithAlerts === 1) level = 'monitorar';
  else if (noData) level = 'sem_dados';

  return { level, alertCount, areasWithAlerts };
}

export function ChildDetailView({ id }: { id: string }) {
  const { data: child, isLoading, isError, error, refetch } = useChild(id);
  const { mutate: review, isPending: reviewing } = useReviewChild();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isError) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-destructive">
            {status === 404
              ? 'Criança não encontrada.'
              : 'Não foi possível carregar os dados desta criança.'}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/children">Voltar à lista</Link>
            </Button>
            {status !== 404 && (
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!child) return null;

  const priority = getPriority(child);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copiado pra área de transferência');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* breadcrumb */}
      <nav aria-label="Localização" className="flex items-center gap-1.5 text-sm">
        <Link
          href="/children"
          className="text-muted-foreground transition-colors hover:text-foreground focus-ring rounded"
        >
          Crianças
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
        <span className="truncate font-medium text-foreground">{child.nome}</span>
      </nav>

      {/* hero */}
      <header className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ChildAvatar child={child} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{child.nome}</h1>
              <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                {child.id}
              </code>
            </div>
            <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <dt className="sr-only">Idade e nascimento</dt>
                <dd>
                  {ageInYears(child.data_nascimento)} anos
                  <span className="ml-1 text-xs">({formatDateBR(child.data_nascimento)})</span>
                </dd>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground/80">{child.bairro}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <dt className="sr-only">Responsável</dt>
                <dd>{child.responsavel}</dd>
              </div>
            </dl>
          </div>

          {/* ações */}
          <div className="flex flex-row gap-1.5 sm:flex-col sm:items-stretch">
            <Button
              type="button"
              variant={child.revisado ? 'outline' : 'success'}
              size="sm"
              onClick={() => review(child.id)}
              disabled={reviewing || child.revisado}
            >
              {reviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {child.revisado ? 'Já revisado' : reviewing ? 'Salvando…' : 'Marcar como revisado'}
            </Button>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                aria-label="Copiar link desta ficha"
                className="flex-1"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                aria-label="Imprimir ficha"
                className="flex-1"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* banner de prioridade */}
      {priority.level !== 'ok' && priority.level !== 'monitorar' && (
        <PriorityBanner
          level={priority.level}
          alertCount={priority.alertCount}
          areasWithAlerts={priority.areasWithAlerts}
        />
      )}

      {/* status do acompanhamento (faixa fina) */}
      {child.revisado && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm">
          <Check className="h-4 w-4 text-success" aria-hidden="true" />
          <span>
            Revisado por <strong className="font-semibold">{child.revisado_por}</strong> em{' '}
            {formatDateTimeBR(child.revisado_em)}
          </span>
        </div>
      )}

      {/* 3 cards de área */}
      <section
        aria-label="Situação por área"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <HealthCard data={child.saude} />
        <EducationCard data={child.educacao} />
        <SocialCard data={child.assistencia_social} />
      </section>

      {/* voltar embaixo (atalho repetido) */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/children" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Link>
        </Button>
      </div>
    </div>
  );
}

function PriorityBanner({
  level,
  alertCount,
  areasWithAlerts,
}: {
  level: 'critico' | 'atencao' | 'sem_dados';
  alertCount: number;
  areasWithAlerts: number;
}) {
  const config = {
    critico: {
      bg: 'border-destructive/40 bg-destructive/10 text-destructive',
      title: 'Caso crítico',
      desc: `${alertCount} ${alertCount === 1 ? 'alerta ativo' : 'alertas ativos'} nas 3 áreas (saúde, educação e assistência social). Priorize a revisão.`,
    },
    atencao: {
      bg: 'border-warning/40 bg-warning/10 text-warning-foreground',
      title: 'Atenção',
      desc: `${alertCount} ${alertCount === 1 ? 'alerta ativo' : 'alertas ativos'} em ${areasWithAlerts} ${areasWithAlerts === 1 ? 'área' : 'áreas'}.`,
    },
    sem_dados: {
      bg: 'border-muted-foreground/30 bg-muted text-muted-foreground',
      title: 'Sem dados em nenhuma área',
      desc: 'Esta criança não aparece em nenhum dos 3 sistemas. Lacuna de cobertura cadastral.',
    },
  }[level];

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-lg border-l-4 p-3 text-sm',
        config.bg,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{config.title}</p>
        <p className="text-sm opacity-90">{config.desc}</p>
      </div>
    </div>
  );
}
