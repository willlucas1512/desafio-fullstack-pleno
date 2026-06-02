import { AlertTriangle, CalendarClock, Heart, Syringe } from 'lucide-react';
import { EmptyArea } from '@/components/status/empty-area';
import { resolveFieldStatus } from '@/lib/field-status';
import { formatDateBR } from '@/lib/format';
import type { HealthInfo } from '@/lib/types';
import { AreaCardShell, AreaField, AreaFields, FieldStatus } from './area-card-shell';

export function HealthCard({ data }: { data: HealthInfo | null }) {
  if (!data) return <EmptyArea area="saude" />;

  const consulta = resolveFieldStatus(
    data.alertas,
    [{ code: 'consulta_atrasada', label: 'Em atraso' }],
    { tone: 'neutral', label: '' },
  );
  const vacinas = resolveFieldStatus(
    data.alertas,
    [{ code: 'vacinas_atrasadas', label: 'Atrasadas' }],
    data.vacinas_em_dia ? { tone: 'good', label: 'Em dia' } : { tone: 'bad', label: 'Atrasadas' },
  );

  return (
    <AreaCardShell
      title="Saúde"
      icon={Heart}
      state={data.alertas.length > 0 ? 'alert' : 'ok'}
    >
      <AreaFields>
        <AreaField label="Última consulta" icon={CalendarClock}>
          <span className="inline-flex flex-col items-start">
            <span>{formatDateBR(data.ultima_consulta)}</span>
            {consulta.tone === 'bad' && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-normal text-destructive">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                {consulta.label}
              </span>
            )}
          </span>
        </AreaField>
        <AreaField label="Vacinas" icon={Syringe}>
          <FieldStatus tone={vacinas.tone}>{vacinas.label}</FieldStatus>
        </AreaField>
      </AreaFields>
    </AreaCardShell>
  );
}
