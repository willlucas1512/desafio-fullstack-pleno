'use client';

import { Inbox } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ChildRow } from '@/components/children/child-row';
import { ChildrenFilters } from '@/components/children/children-filters';
import { ChildrenPagination } from '@/components/children/children-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useChildren } from '@/hooks/use-children';
import type { AlertFilter, ChildrenListParams } from '@/lib/types';

const PAGE_SIZE = 10;
const ALERT_VALUES: AlertFilter[] = ['com', 'sem', 'saude', 'educacao', 'assistencia_social'];

function parseParams(search: URLSearchParams): ChildrenListParams {
  const bairro = search.get('bairro')?.trim() || undefined;
  const alertasRaw = search.get('alertas') ?? '';
  const alertas = ALERT_VALUES.includes(alertasRaw as AlertFilter)
    ? (alertasRaw as AlertFilter)
    : undefined;
  const revisadoRaw = search.get('revisado');
  const revisado = revisadoRaw === 'true' ? true : revisadoRaw === 'false' ? false : undefined;
  const page = Math.max(1, Number(search.get('page')) || 1);
  return { bairro, alertas, revisado, page, pageSize: PAGE_SIZE };
}

function paramsToQuery(params: ChildrenListParams): string {
  const sp = new URLSearchParams();
  if (params.bairro) sp.set('bairro', params.bairro);
  if (params.alertas) sp.set('alertas', params.alertas);
  if (params.revisado !== undefined) sp.set('revisado', String(params.revisado));
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function ChildrenListView() {
  const router = useRouter();
  const search = useSearchParams();
  const params = useMemo(() => parseParams(search), [search]);
  const { data, isLoading, isFetching, isError, refetch } = useChildren(params);

  const updateParams = useCallback(
    (next: ChildrenListParams) => {
      router.replace(`/children${paramsToQuery(next)}`, { scroll: false });
    },
    [router],
  );

  const onPageChange = useCallback(
    (page: number) => updateParams({ ...params, page }),
    [params, updateParams],
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Crianças acompanhadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use os filtros para localizar casos. Os filtros ficam na URL — você pode
          compartilhar o link com o resultado.
        </p>
      </header>

      <ChildrenFilters value={params} onChange={updateParams} />

      <div className="relative" aria-busy={isFetching}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Não foi possível carregar a lista de crianças.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-primary hover:underline focus-ring"
            >
              Tentar novamente
            </button>
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="space-y-2">
            {data.items.map((c) => (
              <li key={c.id}>
                <ChildRow child={c} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Nenhuma criança encontrada</p>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros para ampliar a busca.
            </p>
          </div>
        )}
      </div>

      {data && (
        <ChildrenPagination pagination={data.pagination} onChange={onPageChange} />
      )}
    </div>
  );
}
