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
 * Aplica filtros, ordenação e paginação em memória. É a definição canônica das
 * regras de listagem — o {@link PostgresChildrenRepository} replica o mesmo
 * comportamento em SQL, e o fake de testes reusa esta função.
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

function sortChildren(children: Child[], orderBy: OrderBy): Child[] {
  const arr = [...children];
  switch (orderBy) {
    case 'nome':
      return arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'bairro':
      return arr.sort(
        (a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'),
      );
    case 'idade':
      // mais novo primeiro (data de nascimento mais recente)
      return arr.sort((a, b) => b.data_nascimento.localeCompare(a.data_nascimento));
    case 'revisao':
      // pendentes primeiro, depois revisado mais antigo
      return arr.sort((a, b) => {
        if (a.revisado !== b.revisado) return a.revisado ? 1 : -1;
        return (a.revisado_em ?? '').localeCompare(b.revisado_em ?? '');
      });
    case 'alertas':
    default:
      // mais alertas primeiro; empate desfaz por nome
      return arr.sort((a, b) => countAlerts(b) - countAlerts(a) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }
}
