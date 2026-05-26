import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { NeighborhoodSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
export function NeighborhoodHeatmap({ data }: { data: NeighborhoodSummary[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum bairro com crianças cadastradas.</p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((n) => {
        const ratio = n.total > 0 ? n.com_alertas / n.total : 0;
        const hasGap = n.sem_dados > 0;
        return (
          <li key={n.bairro}>
            <Link
              href={`/children?bairro=${encodeURIComponent(n.bairro)}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              aria-label={`${n.bairro}: ${n.com_alertas} de ${n.total} com alertas${hasGap ? `, ${n.sem_dados} sem dados` : ''}`}
            >
              <Card
                className={cn(
                  'overflow-hidden border-l-4 transition-colors hover:bg-accent/40',
                  ratio >= 0.7 && 'border-l-destructive',
                  ratio >= 0.4 && ratio < 0.7 && 'border-l-warning',
                  ratio > 0 && ratio < 0.4 && 'border-l-primary',
                  ratio === 0 && 'border-l-success',
                )}
              >
                <CardContent
                  className={cn(
                    'flex items-center justify-between p-4',
                    hasGap && 'bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,hsl(var(--muted))_8px,hsl(var(--muted))_10px)]',
                  )}
                >
                  <div>
                    <p className="font-medium">{n.bairro}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.com_alertas} de {n.total} com alertas
                      {hasGap && ` · ${n.sem_dados} sem dados`}
                    </p>
                  </div>
                  <span
                    className="text-lg font-bold"
                    aria-label={`${Math.round(ratio * 100)}% com alertas`}
                  >
                    {Math.round(ratio * 100)}%
                  </span>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
