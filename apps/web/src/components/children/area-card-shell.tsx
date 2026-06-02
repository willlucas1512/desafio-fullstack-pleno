import type { LucideIcon } from 'lucide-react';
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
