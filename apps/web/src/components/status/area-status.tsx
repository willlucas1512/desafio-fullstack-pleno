import { Check, GraduationCap, HandHeart, Heart, Minus, type LucideIcon } from 'lucide-react';
import { AREA_LABEL } from '@/lib/format';
import type { AlertArea, Child } from '@/lib/types';
import { cn } from '@/lib/utils';

type AreaState = 'alert' | 'ok' | 'missing';

const AREA_ICON: Record<AlertArea, LucideIcon> = {
  saude: Heart,
  educacao: GraduationCap,
  assistencia_social: HandHeart,
};

const AREA_ABBR: Record<AlertArea, string> = {
  saude: 'Saúde',
  educacao: 'Educ.',
  assistencia_social: 'Assist.',
};

function stateOf(child: Child, area: AlertArea): { state: AreaState; count: number } {
  const info =
    area === 'saude'
      ? child.saude
      : area === 'educacao'
        ? child.educacao
        : child.assistencia_social;
  if (info === null) return { state: 'missing', count: 0 };
  if (info.alertas.length > 0) return { state: 'alert', count: info.alertas.length };
  return { state: 'ok', count: 0 };
}

/**
 * Mantido pra compat com testes; renderiza um chip individual da área.
 */
export function AreaStatusDot({
  child,
  area,
  className,
}: {
  child: Child;
  area: AlertArea;
  className?: string;
}) {
  return <AreaChip child={child} area={area} className={className} />;
}

export function AreaChip({
  child,
  area,
  className,
}: {
  child: Child;
  area: AlertArea;
  className?: string;
}) {
  const { state, count } = stateOf(child, area);
  const Icon = AREA_ICON[area];
  const label = AREA_LABEL[area];

  const stateClasses =
    state === 'alert'
      ? 'bg-destructive/10 text-destructive ring-destructive/20'
      : state === 'ok'
        ? 'bg-success/10 text-success ring-success/20'
        : 'bg-muted text-muted-foreground ring-border';

  const announcement =
    state === 'alert'
      ? `${label}: ${count} ${count === 1 ? 'alerta' : 'alertas'}`
      : state === 'ok'
        ? `${label}: em dia`
        : `${label}: sem dados`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        stateClasses,
        className,
      )}
      title={announcement}
    >
      <Icon className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
      <span>{AREA_ABBR[area]}</span>
      {state === 'alert' && <span className="font-semibold">{count}</span>}
      {state === 'ok' && <Check className="h-2.5 w-2.5" aria-hidden="true" strokeWidth={3} />}
      {state === 'missing' && <Minus className="h-2.5 w-2.5" aria-hidden="true" />}
      <span className="sr-only">{announcement}</span>
    </span>
  );
}

export function AreaStatusRow({ child }: { child: Child }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Status por área">
      <AreaChip child={child} area="saude" />
      <AreaChip child={child} area="educacao" />
      <AreaChip child={child} area="assistencia_social" />
    </div>
  );
}
