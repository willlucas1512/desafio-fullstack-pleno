import { GraduationCap, Percent, School } from 'lucide-react';
import { AlertBadge } from '@/components/status/alert-badge';
import { EmptyArea } from '@/components/status/empty-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EducationInfo } from '@/lib/types';

export function EducationCard({ data }: { data: EducationInfo | null }) {
  if (!data) return <EmptyArea area="educacao" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-blue-500" aria-hidden="true" />
          Educação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <School className="h-3 w-3" aria-hidden="true" />
              Escola
            </dt>
            <dd className="font-medium">
              {data.escola ?? <span className="italic text-muted-foreground">Não informada</span>}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <Percent className="h-3 w-3" aria-hidden="true" />
              Frequência
            </dt>
            <dd className="font-medium">
              {data.frequencia_percent === null ? (
                <span className="italic text-muted-foreground">—</span>
              ) : (
                <span
                  className={
                    data.frequencia_percent < 75 ? 'text-destructive' : 'text-foreground'
                  }
                >
                  {data.frequencia_percent}%
                </span>
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
