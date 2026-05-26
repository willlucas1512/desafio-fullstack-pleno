import { CalendarCheck, Heart, Syringe } from 'lucide-react';
import { AlertBadge } from '@/components/status/alert-badge';
import { EmptyArea } from '@/components/status/empty-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateBR } from '@/lib/format';
import type { HealthInfo } from '@/lib/types';

export function HealthCard({ data }: { data: HealthInfo | null }) {
  if (!data) return <EmptyArea area="saude" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-rose-500" aria-hidden="true" />
          Saúde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <CalendarCheck className="h-3 w-3" aria-hidden="true" />
              Última consulta
            </dt>
            <dd className="font-medium">{formatDateBR(data.ultima_consulta)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <Syringe className="h-3 w-3" aria-hidden="true" />
              Vacinas em dia
            </dt>
            <dd className="font-medium">
              {data.vacinas_em_dia ? (
                <span className="text-success">Sim</span>
              ) : (
                <span className="text-destructive">Não</span>
              )}
            </dd>
          </div>
        </dl>
        {data.alertas.length > 0 && (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Alertas</p>
            <div className="flex flex-wrap gap-1.5">
              {data.alertas.map((a) => (
                <AlertBadge key={a} code={a} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
