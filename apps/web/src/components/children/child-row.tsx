import { ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { AreaStatusRow } from '@/components/status/area-status';
import { ReviewBadge } from '@/components/status/review-badge';
import { ageInYears, bairroAvatarClass, initials, timeAgo } from '@/lib/format';
import type { Child } from '@/lib/types';
import { cn } from '@/lib/utils';

function countAlerts(child: Child): number {
  return (
    (child.saude?.alertas.length ?? 0) +
    (child.educacao?.alertas.length ?? 0) +
    (child.assistencia_social?.alertas.length ?? 0)
  );
}

function isCritical(child: Child): boolean {
  // alertas nas 3 áreas simultaneamente = caso crítico
  const areasWithAlerts =
    (child.saude && child.saude.alertas.length > 0 ? 1 : 0) +
    (child.educacao && child.educacao.alertas.length > 0 ? 1 : 0) +
    (child.assistencia_social && child.assistencia_social.alertas.length > 0 ? 1 : 0);
  return areasWithAlerts === 3;
}

export function ChildRow({ child }: { child: Child }) {
  const critical = isCritical(child);
  const alertCount = countAlerts(child);
  const reviewLabel = child.revisado_em ? timeAgo(child.revisado_em) : null;

  return (
    <Link
      href={`/children/${child.id}`}
      className={cn(
        'group block rounded-lg border bg-card p-4 transition-all',
        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        critical && 'border-l-4 border-l-destructive',
      )}
    >
      <div className="flex items-start gap-3">
        {/* avatar com iniciais, cor por bairro */}
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            bairroAvatarClass(child.bairro),
          )}
          aria-hidden="true"
        >
          {initials(child.nome)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-foreground">{child.nome}</p>
            <ReviewBadge reviewed={child.revisado} />
            {critical && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Crítico
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{child.bairro}</span>
            {' · '}
            {ageInYears(child.data_nascimento)} anos
            {' · '}
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" aria-hidden="true" />
              {child.responsavel}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <AreaStatusRow child={child} />
            {alertCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {alertCount} {alertCount === 1 ? 'alerta' : 'alertas'}
              </span>
            )}
            {child.revisado && reviewLabel && (
              <span className="text-xs text-muted-foreground">revisado {reviewLabel}</span>
            )}
          </div>
        </div>

        <ChevronRight
          className="mt-1 h-5 w-5 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
