'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Loader2,
  Printer,
  RotateCcw,
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
import { useChild, useReviewChild, useUnreviewChild } from '@/hooks/use-children';
import { alertsByArea, type Priority } from '@/lib/child-status';
import { ageInYears, formatDateBR, formatDateTimeBR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ChildDetailError, ChildDetailSkeleton } from './child-detail-states';

export function ChildDetailView({ id }: { id: string }) {
  const { data: child, isLoading, isError, error, refetch } = useChild(id);
  const { mutate: review, isPending: reviewing } = useReviewChild();
  const { mutate: unreview, isPending: unreviewing } = useUnreviewChild();
  const [copied, setCopied] = useState(false);
  // data/hora de geração da ficha (usada só no cabeçalho de impressão)
  const [generatedAt] = useState(() => new Date().toISOString());

  if (isLoading) return <ChildDetailSkeleton />;
  if (isError) return <ChildDetailError error={error} onRetry={() => void refetch()} />;
  if (!child) return null;

  const level = child.prioridade;
  const alertCount = child.total_alertas;
  const areasWithAlerts = alertsByArea(child).length;

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
      <div className="hidden print:block print-block border-b pb-3">
        <p className="text-sm font-semibold uppercase tracking-wide">
          Prefeitura da Cidade do Rio de Janeiro
        </p>
        <p className="text-xs text-muted-foreground">
          Painel de Acompanhamento Infantil · Ficha gerada em {formatDateTimeBR(generatedAt)}
        </p>
      </div>

      <nav aria-label="Localização" className="flex items-center gap-1.5 text-sm print:hidden">
        <Link
          href="/children"
          className="text-muted-foreground transition-colors hover:text-foreground focus-ring rounded"
        >
          Crianças
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
        <span className="truncate font-medium text-foreground">{child.nome}</span>
      </nav>

      <header className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ChildAvatar child={child} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold leading-none tracking-tight md:text-3xl">
                {child.nome}
              </h1>
              <code className="inline-flex items-center rounded bg-muted px-1.5 py-1 font-mono text-[11px] uppercase leading-none tracking-wide text-muted-foreground">
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

          <div className="flex flex-row flex-wrap gap-1.5 sm:flex-col sm:items-stretch print:hidden">
            {child.revisado ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => unreview(child.id)}
                disabled={unreviewing}
              >
                {unreviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                )}
                {unreviewing ? 'Desfazendo…' : 'Desfazer revisão'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={() => review(child.id)}
                disabled={reviewing}
              >
                {reviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                {reviewing ? 'Salvando…' : 'Marcar como revisado'}
              </Button>
            )}
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
            {child.revisado && (
              <p className="flex w-full items-center gap-1.5 text-[11px] leading-snug text-muted-foreground sm:justify-end">
                <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                <span>
                  Revisado por{' '}
                  <strong className="font-medium text-foreground">{child.revisado_por}</strong> em{' '}
                  {formatDateTimeBR(child.revisado_em)}
                </span>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* some quando o caso já foi revisado — a severidade segue visível nos cards de área */}
      {!child.revisado && level !== 'ok' && level !== 'monitorar' && (
        <PriorityBanner level={level} alertCount={alertCount} areasWithAlerts={areasWithAlerts} />
      )}

      <section
        aria-labelledby="sec-areas"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <h2 id="sec-areas" className="sr-only">
          Situação por área
        </h2>
        <HealthCard data={child.saude} />
        <EducationCard data={child.educacao} />
        <SocialCard data={child.assistencia_social} />
      </section>

      <div className="print:hidden">
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
  level: Extract<Priority, 'critico' | 'atencao' | 'sem_dados'>;
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
      bg: 'border-warning/40 bg-warning/10 text-warning-foreground dark:text-warning',
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
