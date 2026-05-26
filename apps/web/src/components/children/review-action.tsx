'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewBadge } from '@/components/status/review-badge';
import { useReviewChild } from '@/hooks/use-children';
import { formatDateTimeBR } from '@/lib/format';
import type { Child } from '@/lib/types';

export function ReviewAction({ child }: { child: Child }) {
  const { mutate, isPending } = useReviewChild();

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">Acompanhamento</p>
          <ReviewBadge reviewed={child.revisado} />
        </div>
        {child.revisado ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Revisado por <span className="font-medium">{child.revisado_por}</span> em{' '}
            {formatDateTimeBR(child.revisado_em)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Marque como revisado depois de verificar a situação desta criança.
          </p>
        )}
      </div>
      <Button
        type="button"
        variant={child.revisado ? 'outline' : 'success'}
        onClick={() => mutate(child.id)}
        disabled={isPending || child.revisado}
        aria-disabled={isPending || child.revisado}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="h-4 w-4" aria-hidden="true" />
        )}
        {child.revisado ? 'Já revisado' : isPending ? 'Salvando...' : 'Marcar como revisado'}
      </Button>
    </div>
  );
}
