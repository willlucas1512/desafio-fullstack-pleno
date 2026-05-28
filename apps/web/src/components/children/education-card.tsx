import { GraduationCap, School, TrendingDown } from 'lucide-react';
import { AlertBadge } from '@/components/status/alert-badge';
import { EmptyArea } from '@/components/status/empty-area';
import type { EducationInfo } from '@/lib/types';
import { AreaCardShell } from './area-card-shell';

const FREQUENCIA_MINIMA = 75;

export function EducationCard({ data }: { data: EducationInfo | null }) {
  if (!data) return <EmptyArea area="educacao" />;
  const baixaFrequencia =
    data.frequencia_percent !== null && data.frequencia_percent < FREQUENCIA_MINIMA;

  return (
    <AreaCardShell
      title="Educação"
      icon={GraduationCap}
      iconColor="text-blue-500"
      state={data.alertas.length > 0 ? 'alert' : 'ok'}
    >
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <School className="h-3 w-3" aria-hidden="true" />
            Escola
          </dt>
          <dd className="mt-0.5 font-medium">
            {data.escola ?? <span className="italic text-muted-foreground">Não informada</span>}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
            Frequência
          </dt>
          <dd className="mt-0.5 font-medium">
            {data.frequencia_percent === null ? (
              <span className="italic text-muted-foreground">—</span>
            ) : (
              <>
                <span className={baixaFrequencia ? 'text-destructive' : 'text-foreground'}>
                  {data.frequencia_percent}%
                </span>
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (mín. {FREQUENCIA_MINIMA}%)
                </span>
              </>
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
