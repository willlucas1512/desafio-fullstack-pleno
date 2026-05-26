'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNeighborhoods } from '@/hooks/use-children';
import type { AlertFilter, ChildrenListParams } from '@/lib/types';

interface Props {
  value: ChildrenListParams;
  onChange: (next: ChildrenListParams) => void;
}

const ANY = '__all__';
const ALERT_OPTIONS: { value: AlertFilter; label: string }[] = [
  { value: 'com', label: 'Com algum alerta' },
  { value: 'sem', label: 'Sem alertas' },
  { value: 'saude', label: 'Alerta em saúde' },
  { value: 'educacao', label: 'Alerta em educação' },
  { value: 'assistencia_social', label: 'Alerta em assistência social' },
];

export function ChildrenFilters({ value, onChange }: Props) {
  const { data: neighborhoods = [] } = useNeighborhoods();
  const hasFilter = Boolean(value.bairro || value.alertas || value.revisado !== undefined);

  const update = (patch: Partial<ChildrenListParams>) => {
    onChange({ ...value, ...patch, page: 1 });
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <div className="space-y-1.5">
        <Label htmlFor="filter-bairro" className="text-xs uppercase tracking-wide text-muted-foreground">
          Bairro
        </Label>
        <Select
          value={value.bairro ?? ANY}
          onValueChange={(v) => update({ bairro: v === ANY ? undefined : v })}
        >
          <SelectTrigger id="filter-bairro" aria-label="Filtrar por bairro">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos os bairros</SelectItem>
            {neighborhoods.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-alertas" className="text-xs uppercase tracking-wide text-muted-foreground">
          Alertas
        </Label>
        <Select
          value={value.alertas ?? ANY}
          onValueChange={(v) =>
            update({ alertas: v === ANY ? undefined : (v as AlertFilter) })
          }
        >
          <SelectTrigger id="filter-alertas" aria-label="Filtrar por presença de alertas">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos</SelectItem>
            {ALERT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-revisado" className="text-xs uppercase tracking-wide text-muted-foreground">
          Status de revisão
        </Label>
        <Select
          value={value.revisado === undefined ? ANY : value.revisado ? 'true' : 'false'}
          onValueChange={(v) =>
            update({ revisado: v === ANY ? undefined : v === 'true' })
          }
        >
          <SelectTrigger id="filter-revisado" aria-label="Filtrar por status de revisão">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos</SelectItem>
            <SelectItem value="false">Pendentes</SelectItem>
            <SelectItem value="true">Revisados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <div className="flex items-end">
          <Button
            variant="ghost"
            onClick={() => onChange({ page: 1, pageSize: value.pageSize })}
            className="w-full gap-2 sm:w-auto"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
