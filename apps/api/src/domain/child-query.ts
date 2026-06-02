import { z } from 'zod';
import { ALERT_AREAS, type AlertArea } from './alerts.js';
import { countAlerts, hasAlertsIn, hasAnyAlert, normalize } from './child-helpers.js';
import type { Child } from './child.js';

export const alertFilterSchema = z.enum(['com', 'sem', ...ALERT_AREAS]);
export type AlertFilter = z.infer<typeof alertFilterSchema>;

export const orderBySchema = z.enum(['nome', 'bairro', 'idade', 'alertas', 'revisao']);
export type OrderBy = z.infer<typeof orderBySchema>;

export const listChildrenQuerySchema = z.object({
  nome: z.string().trim().min(1).optional(),
  bairro: z.string().trim().min(1).optional(),
  alertas: alertFilterSchema.optional(),
  revisado: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  orderBy: orderBySchema.default('alertas'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type ListChildrenQuery = z.infer<typeof listChildrenQuerySchema>;

export interface ChildrenPage {
  items: Child[];
  total: number;
}

/**
 * Aplica filtros, ordenação e paginação em memória. É a ÚNICA implementação das
 * regras de listagem: tanto o {@link PostgresChildrenRepository} (produção)
 * quanto o {@link FakeChildrenStore} (testes) carregam as crianças e delegam
 * aqui — não há lógica de listagem duplicada em SQL.
 *
 * Ordenação determinística: todas as comparações de texto usam `normalize`
 * (NFD sem acento + lowercase) com comparação por code point, e todo critério
 * termina com `id` como desempate estável.
 */
export function queryChildren(all: Child[], q: ListChildrenQuery): ChildrenPage {
  const filtered = all.filter((child) => matchesFilters(child, q));
  const sorted = sortChildren(filtered, q.orderBy);
  const total = sorted.length;
  const start = (q.page - 1) * q.pageSize;
  return { items: sorted.slice(start, start + q.pageSize), total };
}

function matchesFilters(child: Child, q: ListChildrenQuery): boolean {
  if (q.nome && !normalize(child.nome).includes(normalize(q.nome))) return false;
  if (q.bairro && normalize(child.bairro) !== normalize(q.bairro)) return false;
  if (q.alertas !== undefined && !matchesAlertFilter(child, q.alertas)) return false;
  if (q.revisado !== undefined && child.revisado !== q.revisado) return false;
  return true;
}

function matchesAlertFilter(child: Child, filter: AlertFilter): boolean {
  if (filter === 'com') return hasAnyAlert(child);
  if (filter === 'sem') return !hasAnyAlert(child);
  return hasAlertsIn(child, filter as AlertArea);
}

/** Comparação determinística por code point (UTF-16). */
function byteCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const byName = (a: Child, b: Child): number => byteCompare(normalize(a.nome), normalize(b.nome));
const byId = (a: Child, b: Child): number => byteCompare(a.id, b.id);

function sortChildren(children: Child[], orderBy: OrderBy): Child[] {
  // Todo critério termina com `byId` pra desempate estável idêntico ao SQL.
  return [...children].sort((a, b) => compareBy(orderBy, a, b) || byId(a, b));
}

function compareBy(orderBy: OrderBy, a: Child, b: Child): number {
  switch (orderBy) {
    case 'nome':
      return byName(a, b);
    case 'bairro':
      return byteCompare(normalize(a.bairro), normalize(b.bairro)) || byName(a, b);
    case 'idade':
      // mais novo primeiro (data de nascimento mais recente)
      return byteCompare(b.data_nascimento, a.data_nascimento);
    case 'revisao':
      // pendentes primeiro, depois revisado mais antigo (null = mais antigo)
      if (a.revisado !== b.revisado) return a.revisado ? 1 : -1;
      return byteCompare(a.revisado_em ?? '', b.revisado_em ?? '');
    case 'alertas':
    default:
      // mais alertas primeiro; empate desfaz por nome
      return countAlerts(b) - countAlerts(a) || byName(a, b);
  }
}

/**
 * Bairros distintos na mesma ordem determinística da listagem (chave `normalize`
 * comparada por code point, desempate pelo valor cru). Fonte única usada por
 * ambos os stores.
 */
export function listNeighborhoods(all: Child[]): string[] {
  return [...new Set(all.map((c) => c.bairro))].sort(
    (a, b) => byteCompare(normalize(a), normalize(b)) || byteCompare(a, b),
  );
}
