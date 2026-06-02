'use client';

import { ArrowUpDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNeighborhoods } from '@/hooks/use-children';
import type { AlertFilter, ChildrenListParams, OrderBy } from '@/lib/types';
import { ActiveFilterChips } from './active-filter-chips';
import { ALERT_OPTIONS, ANY, ORDER_OPTIONS } from './children-filter-options';

interface Props {
  value: ChildrenListParams;
  onChange: (next: ChildrenListParams) => void;
}

export function ChildrenFilters({ value, onChange }: Props) {
  const { data: neighborhoods = [] } = useNeighborhoods();
  const update = (patch: Partial<ChildrenListParams>) => {
    onChange({ ...value, ...patch, page: 1 });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 shadow-sm sm:p-4">
      {/* linha 1: busca + sort */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={value.nome ?? ''}
            onChange={(e) => update({ nome: e.target.value || undefined })}
            placeholder="Buscar pelo nome da criança..."
            className="pl-9 pr-9"
            aria-label="Buscar pelo nome"
          />
          {value.nome && (
            <button
              type="button"
              onClick={() => update({ nome: undefined })}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:w-64">
          <Label
            htmlFor="filter-order"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="whitespace-nowrap">Ordenar</span>
          </Label>
          <Select
            value={value.orderBy ?? 'alertas'}
            onValueChange={(v) => update({ orderBy: v as OrderBy })}
          >
            <SelectTrigger id="filter-order" className="flex-1" aria-label="Ordenar por">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* linha 2: filtros */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select
          value={value.bairro ?? ANY}
          onValueChange={(v) => update({ bairro: v === ANY ? undefined : v })}
        >
          <SelectTrigger aria-label="Filtrar por bairro">
            <SelectValue placeholder="Todos os bairros" />
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

        <Select
          value={value.alertas ?? ANY}
          onValueChange={(v) =>
            update({ alertas: v === ANY ? undefined : (v as AlertFilter) })
          }
        >
          <SelectTrigger aria-label="Filtrar por presença de alertas">
            <SelectValue placeholder="Todos os status de alerta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos os status de alerta</SelectItem>
            {ALERT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.revisado === undefined ? ANY : value.revisado ? 'true' : 'false'}
          onValueChange={(v) => update({ revisado: v === ANY ? undefined : v === 'true' })}
        >
          <SelectTrigger aria-label="Filtrar por status de revisão">
            <SelectValue placeholder="Todos os status de revisão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos os status de revisão</SelectItem>
            <SelectItem value="false">Não revisados</SelectItem>
            <SelectItem value="true">Já revisados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ActiveFilterChips value={value} onChange={onChange} />
    </div>
  );
}
