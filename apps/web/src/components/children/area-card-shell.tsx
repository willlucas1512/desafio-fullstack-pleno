import { Check, type LucideIcon, X } from 'lucide-react';
import type { FieldTone } from '@/lib/field-status';
import { cn } from '@/lib/utils';

export type AreaState = 'alert' | 'ok';

export function AreaCardShell({
  title,
  icon: Icon,
  state,
  children,
}: {
  title: string;
  icon: LucideIcon;
  state: AreaState;
  children: React.ReactNode;
}) {
  const alert = state === 'alert';
  return (
    <div className="flex flex-col rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-primary dark:text-foreground">
            {title}
          </h3>
          <span
            className={cn(
              'mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium',
              alert ? 'text-warning-foreground dark:text-warning' : 'text-success',
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', alert ? 'bg-warning' : 'bg-success')}
              aria-hidden="true"
            />
            {alert ? 'Requer atenção' : 'Em dia'}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3 border-t pt-4">{children}</div>
    </div>
  );
}

/** Grade de blocos de informação (2 colunas), cada um com ícone + rótulo + valor. */
export function AreaFields({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">{children}</dl>;
}

export function AreaField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-inset ring-border">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-semibold text-foreground">{children}</dd>
      </div>
    </div>
  );
}

/** Marcador de status de um atributo (✓ ok neutro / ✗ problema vermelho). */
export function FieldStatus({
  tone,
  children,
}: {
  tone: FieldTone;
  children: React.ReactNode;
}) {
  if (tone === 'neutral') return <>{children}</>;
  const good = tone === 'good';
  const Icon = good ? Check : X;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        good ? 'text-muted-foreground dark:text-foreground/80' : 'text-destructive',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

// Medidor de progresso (ex.: frequência vs. mínimo). A cor segue a comparação
// visível (`value < min`) para nunca contradizer o número exibido na tela.
export function AreaMeter({
  label,
  value,
  min,
  icon: Icon,
}: {
  label: string;
  value: number;
  min: number;
  icon: LucideIcon;
}) {
  const below = value < min;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-inset ring-border">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div>
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="mt-0.5 block font-semibold">
            <span className={below ? 'text-destructive' : 'text-success'}>
              {value}%
            </span>
            <span className="ml-1 font-normal text-muted-foreground">/ {min}% mínimo</span>
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value}% (mínimo ${min}%)`}
        >
          <div
            className={cn('h-full rounded-full', below ? 'bg-destructive' : 'bg-success')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
