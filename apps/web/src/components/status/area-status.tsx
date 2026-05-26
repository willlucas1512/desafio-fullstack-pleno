import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';
import { AREA_LABEL } from '@/lib/format';
import type { AlertArea, Child } from '@/lib/types';
import { cn } from '@/lib/utils';
function statusFor(child: Child, area: AlertArea): 'ok' | 'alert' | 'missing' {
  const info = area === 'saude' ? child.saude : area === 'educacao' ? child.educacao : child.assistencia_social;
  if (info === null) return 'missing';
  return info.alertas.length > 0 ? 'alert' : 'ok';
}

export function AreaStatusDot({
  child,
  area,
  className,
}: {
  child: Child;
  area: AlertArea;
  className?: string;
}) {
  const status = statusFor(child, area);
  const label = AREA_LABEL[area];

  const styles = {
    ok: { Icon: CheckCircle2, color: 'text-success', text: `${label}: em dia` },
    alert: { Icon: AlertCircle, color: 'text-destructive', text: `${label}: com alerta` },
    missing: { Icon: MinusCircle, color: 'text-muted-foreground', text: `${label}: sem dados` },
  }[status];

  const { Icon } = styles;
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm', styles.color, className)}
      title={styles.text}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{styles.text}</span>
    </span>
  );
}

export function AreaStatusRow({ child }: { child: Child }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Status por área">
      <AreaStatusDot child={child} area="saude" />
      <AreaStatusDot child={child} area="educacao" />
      <AreaStatusDot child={child} area="assistencia_social" />
    </div>
  );
}
