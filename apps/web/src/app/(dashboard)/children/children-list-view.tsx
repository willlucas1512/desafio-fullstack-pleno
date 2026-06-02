"use client";

import { Inbox, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { ChildRow } from "@/components/children/child-row";
import { ChildrenFilters } from "@/components/children/children-filters";
import { ChildrenPagination } from "@/components/children/children-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useChildren } from "@/hooks/use-children";
import { useChildrenFilters } from "@/hooks/use-children-filters";

export function ChildrenListView() {
  const { params, draft, onFilterChange, onPageChange } = useChildrenFilters();
  const { data, isLoading, isFetching, isError, refetch } = useChildren(params);

  const totalPages = data?.pagination.totalPages;
  useEffect(() => {
    if (totalPages && params.page && params.page > totalPages) {
      onPageChange(totalPages);
    }
  }, [totalPages, params.page, onPageChange]);

  const total = data?.pagination.total;
  const from = data
    ? (data.pagination.page - 1) * data.pagination.pageSize + 1
    : 0;
  const to = data
    ? Math.min(
        data.pagination.page * data.pagination.pageSize,
        data.pagination.total,
      )
    : 0;

  const pageStats = useMemo(() => {
    if (!data) return null;
    let critical = 0;
    let withAlerts = 0;
    for (const c of data.items) {
      if (c.prioridade === "critico") critical++;
      if (c.total_alertas > 0) withAlerts++;
    }
    return { critical, withAlerts };
  }, [data]);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {typeof total === "number"
                ? `${total} ${total === 1 ? "criança" : "crianças"} em acompanhamento`
                : "Crianças em acompanhamento"}
            </h1>
            <span
              aria-hidden="true"
              className="mt-2.5 block h-1 w-16 rounded-full bg-brand"
            />
          </div>
          {isFetching && (
            <span
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:mt-1"
              aria-live="polite"
            >
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Atualizando…
            </span>
          )}
        </div>
        {data && pageStats ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Mostrando{" "}
            <strong className="font-semibold text-foreground">{from}</strong>
            {"–"}
            <strong className="font-semibold text-foreground">{to}</strong>
            {pageStats.critical > 0 && (
              <>
                {" · "}
                <strong className="font-semibold text-destructive">
                  {pageStats.critical}{" "}
                  {pageStats.critical === 1 ? "crítico" : "críticos"}
                </strong>
              </>
            )}
            {pageStats.withAlerts > 0 && (
              <>
                {" · "}
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

      <ChildrenFilters value={draft} onChange={onFilterChange} />

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
            <Inbox
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">Nenhuma criança encontrada</p>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros para ampliar a busca.
            </p>
          </div>
        )}
      </div>

      {data && (
        <ChildrenPagination
          pagination={data.pagination}
          onChange={onPageChange}
        />
      )}
    </div>
  );
}
