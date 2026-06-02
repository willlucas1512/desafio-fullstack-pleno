'use client';

import {
  Check,
  ChevronRight,
  GraduationCap,
  HandHeart,
  Heart,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ChildAvatar } from '@/components/children/child-avatar';
import { useReviewChild } from '@/hooks/use-children';
import { alertsByArea, type Priority } from '@/lib/child-status';
import { ageInYears, AREA_SHORT_LABEL, timeAgo } from '@/lib/format';
import type { AlertArea, Child } from '@/lib/types';
import { cn } from '@/lib/utils';

const AREA_ICON: Record<AlertArea, LucideIcon> = {
  saude: Heart,
  educacao: GraduationCap,
  assistencia_social: HandHeart,
};

// um único eixo de cor: vermelho = crítico, âmbar = atenção. O resto fica neutro
// (a largura da borda é mantida transparente p/ alinhar todos os cards).
const PRIORITY_BORDER: Record<Priority, string> = {
  critico: 'border-l-4 border-l-destructive',
  atencao: 'border-l-4 border-l-warning',
  monitorar: 'border-l-4 border-l-transparent',
  sem_dados: 'border-l-4 border-l-transparent',
  ok: 'border-l-4 border-l-transparent',
};

export function ChildRow({ child }: { child: Child }) {
  const priority: Priority = child.prioridade;
  const areas = alertsByArea(child);
  const totalAlerts = child.total_alertas;
  const reviewLabel = child.revisado_em ? timeAgo(child.revisado_em) : null;
  const { mutate: review, isPending: reviewing } = useReviewChild();

  const handleQuickReview = () => {
    if (!child.revisado && !reviewing) review(child.id);
  };

  return (
    // padrão "link em overlay": o <a> cobre o card inteiro e o botão "Revisar"
    // fica como irmão acima dele (z-10) — evita <button> aninhado dentro de <a>.
    <div
      className={cn(
        'group relative flex h-full flex-col justify-center rounded-lg border bg-card p-4 transition-colors',
        'hover:border-primary/40 hover:bg-secondary/40',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        PRIORITY_BORDER[priority],
      )}
    >
      <Link
        href={`/children/${child.id}`}
        aria-label={`Ver ficha de ${child.nome}`}
        className="absolute inset-0 rounded-lg focus:outline-none"
      >
        <span className="sr-only">Ver ficha de {child.nome}</span>
      </Link>
      <div className="flex items-start gap-3">
        <ChildAvatar child={child} size="md" />

        <div className="min-w-0 flex-1">
          {/* nome + contagem na mesma linha: a contagem fica no topo (não
              "flutua" no meio vertical) e libera a largura antes consumida
              pela coluna de ações. */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-base font-semibold text-foreground">{child.nome}</p>
              {child.revisado && (
                <Check
                  className="h-4 w-4 shrink-0 text-success"
                  strokeWidth={3}
                  aria-label="Revisado"
                />
              )}
            </div>
            {totalAlerts > 0 && (
              <span
                className="flex shrink-0 items-baseline gap-1 leading-none"
                title={`${totalAlerts} ${totalAlerts === 1 ? 'alerta' : 'alertas'} no total`}
              >
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums',
                    priority === 'critico' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {totalAlerts}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {totalAlerts === 1 ? 'alerta' : 'alertas'}
                </span>
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {child.bairro} · {ageInYears(child.data_nascimento)} anos · {child.responsavel}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {areas.length > 0 ? (
              areas.map(({ area, count }) => {
                const Icon = AREA_ICON[area];
                return (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                    title={`${AREA_SHORT_LABEL[area]}: ${count} ${count === 1 ? 'alerta' : 'alertas'}`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    {`${AREA_SHORT_LABEL[area]}:`}
                    <span className="font-semibold text-foreground">{count}</span>
                    {count === 1 ? 'alerta' : 'alertas'}
                  </span>
                );
              })
            ) : child.prioridade === 'sem_dados' ? (
              <span className="text-xs text-muted-foreground">Sem dados registrados</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                Sem alertas
              </span>
            )}
          </div>

          {child.revisado && reviewLabel && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Revisado {reviewLabel}</p>
          )}
        </div>

        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 self-center text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>

      {/* ação rápida: sobreposta no canto (não reserva largura no fluxo, que
          antes espremia o texto no mobile mesmo estando invisível). */}
      {!child.revisado && (
        <button
          type="button"
          onClick={handleQuickReview}
          disabled={reviewing}
          aria-label="Marcar como revisado"
          className={cn(
            'absolute bottom-3 right-3 z-10 inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors',
            'hover:border-primary/40 hover:bg-secondary hover:text-foreground',
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
    </div>
  );
}
