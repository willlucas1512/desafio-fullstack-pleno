'use client';

import { Inbox, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChildRow } from '@/components/children/child-row';
import { ChildrenFilters } from '@/components/children/children-filters';
import { ChildrenPagination } from '@/components/children/children-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useChildren } from '@/hooks/use-children';
import type { AlertFilter, ChildrenListParams, OrderBy } from '@/lib/types';

const PAGE_SIZE = 10;
const ALERT_VALUES: AlertFilter[] = ['com', 'sem', 'saude', 'educacao', 'assistencia_social'];
const ORDER_VALUES: OrderBy[] = ['alertas', 'nome', 'bairro', 'idade', 'revisao'];

function parseParams(search: URLSearchParams): ChildrenListParams {
  const nome = search.get('nome')?.trim() || undefined;
  const bairro = search.get('bairro')?.trim() || undefined;
  const alertasRaw = search.get('alertas') ?? '';
  const alertas = ALERT_VALUES.includes(alertasRaw as AlertFilter)
    ? (alertasRaw as AlertFilter)
    : undefined;
  const revisadoRaw = search.get('revisado');
  const revisado = revisadoRaw === 'true' ? true : revisadoRaw === 'false' ? false : undefined;
  const orderByRaw = search.get('orderBy') ?? '';
  const orderBy = ORDER_VALUES.includes(orderByRaw as OrderBy)
    ? (orderByRaw as OrderBy)
    : ('alertas' as OrderBy);
  const page = Math.max(1, Number(search.get('page')) || 1);
  return { nome, bairro, alertas, revisado, orderBy, page, pageSize: PAGE_SIZE };
}

function paramsToQuery(params: ChildrenListParams): string {
  const sp = new URLSearchParams();
  if (params.nome) sp.set('nome', params.nome);
  if (params.bairro) sp.set('bairro', params.bairro);
  if (params.alertas) sp.set('alertas', params.alertas);
  if (params.revisado !== undefined) sp.set('revisado', String(params.revisado));
  if (params.orderBy && params.orderBy !== 'alertas') sp.set('orderBy', params.orderBy);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function ChildrenListView() {
  const router = useRouter();
  const search = useSearchParams();
  const urlParams = useMemo(() => parseParams(search), [search]);

  // estado local pro filtro com debounce (busca por nome)
  const [draft, setDraft] = useState(urlParams);

  useEffect(() => {
    setDraft(urlParams);
  }, [urlParams]);

  // debounce só na busca por nome (300ms)
  useEffect(() => {
    if (draft.nome === urlParams.nome) return;
    const timer = setTimeout(() => {
      router.replace(`/children${paramsToQuery(draft)}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.nome]);

  const { data, isLoading, isFetching, isError, refetch } = useChildren(urlParams);

  const updateParams = useCallback(
    (next: ChildrenListParams) => {
      setDraft(next);
      router.replace(`/children${paramsToQuery(next)}`, { scroll: false });
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (next: ChildrenListParams) => {
      // se mudou só o nome, deixa o debounce decidir
      if (
        next.nome !== draft.nome &&
        next.bairro === draft.bairro &&
        next.alertas === draft.alertas &&
        next.revisado === draft.revisado &&
        next.orderBy === draft.orderBy
      ) {
        setDraft(next);
        return;
      }
      updateParams(next);
    },
    [draft, updateParams],
  );

  const onPageChange = useCallback(
    (page: number) => updateParams({ ...urlParams, page }),
    [urlParams, updateParams],
  );

  const total = data?.pagination.total;
  const from = data ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0;
  const to = data ? Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total) : 0;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Crianças acompanhadas</h1>
          {isFetching && (
            <span
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Atualizando…
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {typeof total === 'number' ? (
            total === 0 ? (
              <>Nenhuma criança encontrada com esses filtros.</>
            ) : (
              <>
                Mostrando <strong className="font-semibold text-foreground">{from}</strong>
                {'–'}
                <strong className="font-semibold text-foreground">{to}</strong> de{' '}
                <strong className="font-semibold text-foreground">{total}</strong>{' '}
                {total === 1 ? 'criança' : 'crianças'}.
              </>
            )
          ) : (
            <>Carregando crianças acompanhadas…</>
          )}
        </p>
      </header>

      <ChildrenFilters value={draft} onChange={handleFilterChange} />

      <div className="relative" aria-busy={isFetching}>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
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
          <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
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
