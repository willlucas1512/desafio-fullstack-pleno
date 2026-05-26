import { ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AreaStatusRow } from '@/components/status/area-status';
import { ReviewBadge } from '@/components/status/review-badge';
import { ageInYears } from '@/lib/format';
import type { Child } from '@/lib/types';

export function ChildRow({ child }: { child: Child }) {
  return (
    <Link
      href={`/children/${child.id}`}
      className="group block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{child.nome}</p>
            <ReviewBadge reviewed={child.revisado} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {child.bairro} · {ageInYears(child.data_nascimento)} anos · resp. {child.responsavel}
          </p>
          <div className="mt-3">
            <AreaStatusRow child={child} />
          </div>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
