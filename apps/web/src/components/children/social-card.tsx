import { FileText, HandHeart, Wallet } from 'lucide-react';
import { EmptyArea } from '@/components/status/empty-area';
import { resolveFieldStatus } from '@/lib/field-status';
import type { SocialAssistanceInfo } from '@/lib/types';
import { AreaCardShell } from './area-card-shell';
import { AreaField, AreaFields } from './area-field';
import { FieldStatus } from './field-status';

export function SocialCard({ data }: { data: SocialAssistanceInfo | null }) {
  if (!data) return <EmptyArea area="assistencia_social" />;

  const cadUnico = resolveFieldStatus(
    data.alertas,
    [
      { code: 'cadastro_desatualizado', label: 'Desatualizado' },
      { code: 'cadastro_ausente', label: 'Ausente' },
    ],
    data.cad_unico ? { tone: 'good', label: 'Ativo' } : { tone: 'bad', label: 'Ausente' },
  );
  const beneficio = resolveFieldStatus(
    data.alertas,
    [{ code: 'beneficio_suspenso', label: 'Suspenso' }],
    data.beneficio_ativo ? { tone: 'good', label: 'Ativo' } : { tone: 'bad', label: 'Suspenso' },
  );

  return (
    <AreaCardShell
      title="Assistência social"
      icon={HandHeart}
      state={data.alertas.length > 0 ? 'alert' : 'ok'}
    >
      <AreaFields>
        <AreaField label="CadÚnico" icon={FileText}>
          <FieldStatus tone={cadUnico.tone}>{cadUnico.label}</FieldStatus>
        </AreaField>
        <AreaField label="Benefício" icon={Wallet}>
          <FieldStatus tone={beneficio.tone}>{beneficio.label}</FieldStatus>
        </AreaField>
      </AreaFields>
    </AreaCardShell>
  );
}
