'use client';

import { Inbox, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChildRow } from '@/components/children/child-row';
import { ChildrenFilters } from '@/components/children/children-filters';
import { ChildrenPagination } from '@/components/children/children-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useChildren } from '@/hooks/use-children';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { alertsByArea } from '@/lib/child-status';
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

  // rascunho local dos filtros (mantém os inputs controlados); a URL é a fonte de verdade
  const [draft, setDraft] = useState(urlParams);
  const debouncedNome = useDebouncedValue(draft.nome, 300);

  // re-sincroniza quando a URL muda por fora (voltar/avançar, links pré-filtrados)
  useEffect(() => {
    setDraft(urlParams);
  }, [urlParams]);

  const updateParams = useCallback(
    (next: ChildrenListParams) => {
      setDraft(next);
      router.replace(`/children${paramsToQuery(next)}`, { scroll: false });
    },
    [router],
  );

  // busca por nome: só vai pra URL depois que o usuário para de digitar (300ms)
  useEffect(() => {
    if (debouncedNome === urlParams.nome) return;
    router.replace(`/children${paramsToQuery({ ...draft, nome: debouncedNome })}`, {
      scroll: false,
    });
  }, [debouncedNome, urlParams.nome, draft, router]);

  const { data, isLoading, isFetching, isError, refetch } = useChildren(urlParams);

  const handleFilterChange = useCallback(
    (next: ChildrenListParams) => {
      // mudou só o nome -> atualiza o rascunho e deixa o debounce empurrar pra URL;
      // qualquer outro filtro (ou combinação) aplica na hora
      const onlyNomeChanged =
        next.nome !== draft.nome &&
        next.bairro === draft.bairro &&
        next.alertas === draft.alertas &&
        next.revisado === draft.revisado &&
        next.orderBy === draft.orderBy;
      if (onlyNomeChanged) setDraft(next);
      else updateParams(next);
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

  const pageStats = useMemo(() => {
    if (!data) return null;
    let critical = 0;
    let withAlerts = 0;
    for (const c of data.items) {
      const areas = alertsByArea(c).length;
      if (areas === 3) critical++;
      if (areas > 0) withAlerts++;
    }
    return { critical, withAlerts };
  }, [data]);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {typeof total === 'number'
                ? `${total} ${total === 1 ? 'criança' : 'crianças'} em acompanhamento`
                : 'Crianças em acompanhamento'}
            </h1>
            {/* régua ciano — assinatura visual do prefeitura.rio */}
            <span aria-hidden="true" className="mt-2.5 block h-1 w-16 rounded-full bg-brand" />
          </div>
          {isFetching && (
            <span
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:mt-1"
              aria-live="polite"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Atualizando…
            </span>
          )}
        </div>
        {data && pageStats ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Mostrando <strong className="font-semibold text-foreground">{from}</strong>
            {'–'}
            <strong className="font-semibold text-foreground">{to}</strong>
            {pageStats.critical > 0 && (
              <>
                {' · '}
                <strong className="font-semibold text-destructive">
                  {pageStats.critical} {pageStats.critical === 1 ? 'crítico' : 'críticos'}
                </strong>
              </>
            )}
            {pageStats.withAlerts > 0 && (
              <>
                {' · '}
                <strong className="font-semibold text-warning">
                  {pageStats.withAlerts} com alertas
                </strong>
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        )}
      </header>

      <ChildrenFilters value={draft} onChange={handleFilterChange} />

      <div className="relative" aria-busy={isFetching}>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
