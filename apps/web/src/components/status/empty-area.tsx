import { FileQuestion } from 'lucide-react';
import { AREA_LABEL } from '@/lib/format';
import type { AlertArea } from '@/lib/types';

export function EmptyArea({ area }: { area: AlertArea }) {
  return (
    <div className="flex flex-col rounded-lg border border-dashed bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {AREA_LABEL[area]}
          </h3>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
            Sem dados
          </span>
        </div>
      </div>
      <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
        Esta criança não aparece nos registros desta área. Verifique a cobertura cadastral.
      </p>
    </div>
  );
}
