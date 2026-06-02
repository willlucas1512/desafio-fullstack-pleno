/** Tamanho fixo da página na listagem de crianças. */
export const PAGE_SIZE = 10;

/** Atraso (ms) do debounce da busca por nome antes de empurrar pra URL. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Tempo padrão (ms) que uma query fica "fresh" antes de permitir refetch. */
export const DEFAULT_STALE_TIME_MS = 30_000;

/** Bairros mudam raramente — cache mais longo (ms). */
export const NEIGHBORHOODS_STALE_TIME_MS = 5 * 60_000;
