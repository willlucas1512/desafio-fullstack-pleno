'use client';

import { Check, ChevronRight, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { AreaStatusRow } from '@/components/status/area-status';
import { useReviewChild } from '@/hooks/use-children';
import { ageInYears, bairroAvatarClass, initials, timeAgo } from '@/lib/format';
import type { Child } from '@/lib/types';
import { cn } from '@/lib/utils';

type Priority = 'critico' | 'atencao' | 'monitorar' | 'sem_dados' | 'ok';

function countAlerts(child: Child): number {
  return (
    (child.saude?.alertas.length ?? 0) +
    (child.educacao?.alertas.length ?? 0) +
    (child.assistencia_social?.alertas.length ?? 0)
  );
}

function countAreasWithAlerts(child: Child): number {
  return (
    (child.saude && child.saude.alertas.length > 0 ? 1 : 0) +
    (child.educacao && child.educacao.alertas.length > 0 ? 1 : 0) +
    (child.assistencia_social && child.assistencia_social.alertas.length > 0 ? 1 : 0)
  );
}

function getPriority(child: Child): Priority {
  const areas = countAreasWithAlerts(child);
  if (areas === 3) return 'critico';
  if (areas === 2) return 'atencao';
  if (areas === 1) return 'monitorar';
  const noData =
    child.saude === null && child.educacao === null && child.assistencia_social === null;
  if (noData) return 'sem_dados';
  return 'ok';
}

const PRIORITY_META: Record<
  Priority,
  { border: string; chip: { bg: string; text: string; label: string } | null }
> = {
  critico: {
    border: 'border-l-4 border-l-destructive',
    chip: { bg: 'bg-destructive', text: 'text-destructive-foreground', label: 'Crítico' },
  },
  atencao: {
    border: 'border-l-4 border-l-warning',
    chip: { bg: 'bg-warning', text: 'text-warning-foreground', label: 'Atenção' },
  },
  monitorar: { border: '', chip: null },
  sem_dados: {
    border: 'border-l-4 border-l-muted-foreground/40',
    chip: { bg: 'bg-muted-foreground/15', text: 'text-muted-foreground', label: 'Sem dados' },
  },
  ok: { border: '', chip: null },
};

export function ChildRow({ child }: { child: Child }) {
  const priority = getPriority(child);
  const alertCount = countAlerts(child);
  const reviewLabel = child.revisado_em ? timeAgo(child.revisado_em) : null;
  const meta = PRIORITY_META[priority];
  const { mutate: review, isPending: reviewing } = useReviewChild();

  const handleQuickReview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!child.revisado && !reviewing) review(child.id);
  };

  return (
    <Link
      href={`/children/${child.id}`}
      className={cn(
        'group block rounded-lg border bg-card p-3 transition-all',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        meta.border,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm',
            bairroAvatarClass(child.bairro),
          )}
          aria-hidden="true"
        >
          {initials(child.nome)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-base font-semibold text-foreground">{child.nome}</p>
            {meta.chip && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  meta.chip.bg,
                  meta.chip.text,
                )}
              >
                {meta.chip.label}
              </span>
            )}
            {child.revisado && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success ring-1 ring-inset ring-success/30">
                <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                Revisado
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{child.bairro}</span>
            {' · '}
            {ageInYears(child.data_nascimento)} anos
            {' · '}
            <span className="inline-flex items-center gap-0.5">
              <User className="h-3 w-3" aria-hidden="true" />
              {child.responsavel}
            </span>
          </p>
          <div className="mt-2">
            <AreaStatusRow child={child} />
          </div>
          {child.revisado && reviewLabel && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Revisado {reviewLabel}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {alertCount > 0 && (
            <span
              className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground"
              title={`${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'} ativos`}
            >
              {alertCount}
            </span>
          )}
          {!child.revisado && (
            <button
              type="button"
              onClick={handleQuickReview}
              disabled={reviewing}
              aria-label="Marcar como revisado"
              className={cn(
                'inline-flex h-7 items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 text-[11px] font-medium text-success transition-all',
                'hover:bg-success hover:text-success-foreground',
                'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {reviewing ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
              )}
              Revisar
            </button>
          )}
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}
