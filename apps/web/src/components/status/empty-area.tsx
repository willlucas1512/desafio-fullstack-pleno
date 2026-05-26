import { Info } from 'lucide-react';
import { AREA_LABEL } from '@/lib/format';
import type { AlertArea } from '@/lib/types';
export function EmptyArea({ area }: { area: AlertArea }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium text-foreground">Sem dados de {AREA_LABEL[area].toLowerCase()}</p>
        <p>Esta criança não aparece nos registros desta área. Verifique cobertura cadastral.</p>
      </div>
    </div>
  );
}
