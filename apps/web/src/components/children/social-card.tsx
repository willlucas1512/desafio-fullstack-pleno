import { Coins, FileText, HandHeart } from 'lucide-react';
import { AlertBadge } from '@/components/status/alert-badge';
import { EmptyArea } from '@/components/status/empty-area';
import type { SocialAssistanceInfo } from '@/lib/types';
import { AreaCardShell } from './area-card-shell';

export function SocialCard({ data }: { data: SocialAssistanceInfo | null }) {
  if (!data) return <EmptyArea area="assistencia_social" />;

  return (
    <AreaCardShell
      title="Assistência social"
      icon={HandHeart}
      iconColor="text-emerald-500"
      state={data.alertas.length > 0 ? 'alert' : 'ok'}
    >
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <FileText className="h-3 w-3" aria-hidden="true" />
            CadÚnico
          </dt>
          <dd className="mt-0.5 font-medium">
            {data.cad_unico ? (
              <span className="text-success">Ativo</span>
            ) : (
              <span className="text-destructive">Ausente</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Coins className="h-3 w-3" aria-hidden="true" />
            Benefício
          </dt>
          <dd className="mt-0.5 font-medium">
            {data.beneficio_ativo ? (
              <span className="text-success">Ativo</span>
            ) : (
              <span className="text-destructive">Suspenso</span>
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
