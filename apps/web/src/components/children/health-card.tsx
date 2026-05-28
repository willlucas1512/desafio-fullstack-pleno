import { AlertTriangle, CalendarCheck, Heart, Syringe } from 'lucide-react';
import { AlertBadge } from '@/components/status/alert-badge';
import { EmptyArea } from '@/components/status/empty-area';
import { formatDateBR } from '@/lib/format';
import type { HealthInfo } from '@/lib/types';
import { AreaCardShell } from './area-card-shell';

function isStale(iso: string | null): boolean {
  if (!iso) return false;
  const consulta = new Date(iso);
  if (Number.isNaN(consulta.getTime())) return false;
  const meses = (Date.now() - consulta.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return meses > 6;
}

export function HealthCard({ data }: { data: HealthInfo | null }) {
  if (!data) return <EmptyArea area="saude" />;
  const stale = isStale(data.ultima_consulta);

  return (
    <AreaCardShell
      title="Saúde"
      icon={Heart}
      iconColor="text-rose-500"
      state={data.alertas.length > 0 ? 'alert' : 'ok'}
    >
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CalendarCheck className="h-3 w-3" aria-hidden="true" />
            Última consulta
          </dt>
          <dd className="mt-0.5 font-medium">
            {formatDateBR(data.ultima_consulta)}
            {stale && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-normal text-warning">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                há mais de 6 meses
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Syringe className="h-3 w-3" aria-hidden="true" />
            Vacinas em dia
          </dt>
          <dd className="mt-0.5 font-medium">
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
          <p className="mb-1 text-xs font-medium text-muted-foreground">Alertas</p>
          <div className="flex flex-wrap gap-1.5">
            {data.alertas.map((a) => (
              <AlertBadge key={a} code={a} />
            ))}
          </div>
        </div>
      )}
    </AreaCardShell>
  );
}
