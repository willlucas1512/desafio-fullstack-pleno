'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChildrenListParams } from '@/lib/types';
import { ALERT_OPTIONS } from './children-filter-options';

interface Props {
  value: ChildrenListParams;
  onChange: (next: ChildrenListParams) => void;
}

/** Resumo dos filtros ativos como chips removíveis + "limpar tudo". */
export function ActiveFilterChips({ value, onChange }: Props) {
  const chips: { label: string; clear: () => void }[] = [];
  if (value.nome) {
    chips.push({
      label: `Nome: "${value.nome}"`,
      clear: () => onChange({ ...value, nome: undefined, page: 1 }),
    });
  }
  if (value.bairro) {
    chips.push({
      label: `Bairro: ${value.bairro}`,
      clear: () => onChange({ ...value, bairro: undefined, page: 1 }),
    });
  }
  if (value.alertas) {
    const found = ALERT_OPTIONS.find((o) => o.value === value.alertas);
    chips.push({
      label: found?.label ?? value.alertas,
      clear: () => onChange({ ...value, alertas: undefined, page: 1 }),
    });
  }
  if (value.revisado !== undefined) {
    chips.push({
      label: value.revisado ? 'Já revisados' : 'Não revisados',
      clear: () => onChange({ ...value, revisado: undefined, page: 1 }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 focus-ring"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="ml-1 h-7 px-2 text-xs"
        onClick={() =>
          onChange({
            page: 1,
            pageSize: value.pageSize,
            orderBy: value.orderBy,
          })
        }
      >
        Limpar tudo
      </Button>
    </div>
  );
}
