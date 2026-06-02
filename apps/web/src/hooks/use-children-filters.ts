"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import type { AlertFilter, ChildrenListParams, OrderBy } from "@/lib/types";

const ALERT_VALUES: AlertFilter[] = [
  "com",
  "sem",
  "saude",
  "educacao",
  "assistencia_social",
];
const ORDER_VALUES: OrderBy[] = [
  "alertas",
  "nome",
  "bairro",
  "idade",
  "revisao",
];

export function parseParams(search: URLSearchParams): ChildrenListParams {
  const nome = search.get("nome")?.trim() || undefined;
  const bairro = search.get("bairro")?.trim() || undefined;
  const alertasRaw = search.get("alertas") ?? "";
  const alertas = ALERT_VALUES.includes(alertasRaw as AlertFilter)
    ? (alertasRaw as AlertFilter)
    : undefined;
  const revisadoRaw = search.get("revisado");
  const revisado =
    revisadoRaw === "true" ? true : revisadoRaw === "false" ? false : undefined;
  const orderByRaw = search.get("orderBy") ?? "";
  const orderBy = ORDER_VALUES.includes(orderByRaw as OrderBy)
    ? (orderByRaw as OrderBy)
    : ("alertas" as OrderBy);
  const page = Math.max(1, Number(search.get("page")) || 1);
  return {
    nome,
    bairro,
    alertas,
    revisado,
    orderBy,
    page,
    pageSize: PAGE_SIZE,
  };
}

export function paramsToQuery(params: ChildrenListParams): string {
  const sp = new URLSearchParams();
  if (params.nome) sp.set("nome", params.nome);
  if (params.bairro) sp.set("bairro", params.bairro);
  if (params.alertas) sp.set("alertas", params.alertas);
  if (params.revisado !== undefined)
    sp.set("revisado", String(params.revisado));
  if (params.orderBy && params.orderBy !== "alertas")
    sp.set("orderBy", params.orderBy);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export interface ChildrenFiltersController {
  /** Estado efetivo da busca (URL = fonte de verdade) — alimenta a query. */
  params: ChildrenListParams;
  /** Rascunho local dos inputs (controlados); a busca por nome é debounced. */
  draft: ChildrenListParams;
  /** Aplica mudança de filtro: só-nome vai por debounce, o resto na hora. */
  onFilterChange: (next: ChildrenListParams) => void;
  /** Troca de página, preservando os filtros atuais. */
  onPageChange: (page: number) => void;
}

export function useChildrenFilters(): ChildrenFiltersController {
  const router = useRouter();
  const search = useSearchParams();
  const params = useMemo(() => parseParams(search), [search]);

  const [draft, setDraft] = useState(params);
  const debouncedNome = useDebouncedValue(draft.nome, SEARCH_DEBOUNCE_MS);

  // re-sincroniza quando a URL muda por fora (voltar/avançar, links pré-filtrados)
  useEffect(() => {
    setDraft(params);
  }, [params]);

  const commit = useCallback(
    (next: ChildrenListParams) => {
      setDraft(next);
      router.replace(`/children${paramsToQuery(next)}`, { scroll: false });
    },
    [router],
  );

  // busca por nome: só vai pra URL depois que o usuário para de digitar (300ms)
  useEffect(() => {
    if (debouncedNome === params.nome) return;
    router.replace(
      `/children${paramsToQuery({ ...draft, nome: debouncedNome })}`,
      {
        scroll: false,
      },
    );
  }, [debouncedNome, params.nome, draft, router]);

  const onFilterChange = useCallback(
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
      else commit(next);
    },
    [draft, commit],
  );

  const onPageChange = useCallback(
    (page: number) => commit({ ...params, page }),
    [params, commit],
  );

  return { params, draft, onFilterChange, onPageChange };
}
