import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AreaState = 'alert' | 'ok';

export function AreaCardShell({
  title,
  icon: Icon,
  state,
  iconColor,
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconColor: string; // ex: 'text-rose-500'
  state: AreaState;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'border-l-4 transition-colors',
        state === 'alert' && 'border-l-destructive/70',
        state === 'ok' && 'border-l-success/60',
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn('h-4 w-4', iconColor)} aria-hidden="true" />
          {title}
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              state === 'alert' && 'bg-destructive/10 text-destructive',
              state === 'ok' && 'bg-success/10 text-success',
            )}
          >
            {state === 'alert' ? 'Com alerta' : 'Em dia'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}
