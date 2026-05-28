'use client';

import { ArrowUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { AREA_LABEL } from '@/lib/format';
import type { AlertFilter, ChildrenListParams, OrderBy } from '@/lib/types';

interface Props {
  value: ChildrenListParams;
  onChange: (next: ChildrenListParams) => void;
}

const ANY = '__all__';

const ALERT_OPTIONS: { value: AlertFilter; label: string }[] = [
  { value: 'com', label: 'Com algum alerta' },
  { value: 'sem', label: 'Sem alertas' },
  { value: 'saude', label: `Alerta em ${AREA_LABEL.saude.toLowerCase()}` },
  { value: 'educacao', label: `Alerta em ${AREA_LABEL.educacao.toLowerCase()}` },
  { value: 'assistencia_social', label: `Alerta em ${AREA_LABEL.assistencia_social.toLowerCase()}` },
];

const ORDER_OPTIONS: { value: OrderBy; label: string }[] = [
  { value: 'alertas', label: 'Mais alertas' },
  { value: 'nome', label: 'Nome (A-Z)' },
  { value: 'bairro', label: 'Bairro' },
  { value: 'idade', label: 'Mais novo' },
  { value: 'revisao', label: 'Pendentes primeiro' },
];

export function ChildrenFilters({ value, onChange }: Props) {
  const { data: neighborhoods = [] } = useNeighborhoods();
  const update = (patch: Partial<ChildrenListParams>) => {
    onChange({ ...value, ...patch, page: 1 });
  };

  return (
    <div className="space-y-3">
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
            <SelectValue placeholder="Qualquer status de alerta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Qualquer status de alerta</SelectItem>
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
            <SelectValue placeholder="Qualquer status de revisão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Qualquer status de revisão</SelectItem>
            <SelectItem value="false">Não revisados</SelectItem>
            <SelectItem value="true">Já revisados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ActiveFilterChips value={value} onChange={onChange} />
    </div>
  );
}

function ActiveFilterChips({ value, onChange }: Props) {
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
