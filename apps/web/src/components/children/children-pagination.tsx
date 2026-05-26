'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Pagination } from '@/lib/types';

interface Props {
  pagination: Pagination;
  onChange: (page: number) => void;
}

export function ChildrenPagination({ pagination, onChange }: Props) {
  const { page, totalPages, total, pageSize } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      className="flex flex-col items-center justify-between gap-2 sm:flex-row"
      aria-label="Paginação dos resultados"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Mostrando <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
