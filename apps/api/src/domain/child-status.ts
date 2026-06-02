import { z } from 'zod';
import { ALERT_AREAS } from './alerts.js';
import { countAlerts, hasAlertsIn, hasNoAreaData } from './child-helpers.js';
import { childSchema, type Child } from './child.js';

export const prioridadeSchema = z.enum(['critico', 'atencao', 'monitorar', 'sem_dados', 'ok']);
export type Prioridade = z.infer<typeof prioridadeSchema>;

/** Nº de áreas (saúde/educação/assistência) que têm ao menos um alerta. */
export function countAreasWithAlerts(child: Child): number {
  return ALERT_AREAS.reduce((n, area) => (hasAlertsIn(child, area) ? n + 1 : n), 0);
}

/**
 * Classificação de prioridade do caso — definição canônica ÚNICA. Antes vivia
 * duplicada no frontend (`lib/child-status.ts`); agora é derivada no servidor e
 * exposta na resposta da API, então a regra mora num lugar só e é testada com o
 * mesmo rigor do resto do backend.
 */
export function derivePriority(child: Child): Prioridade {
  const areas = countAreasWithAlerts(child);
  if (areas === 3) return 'critico';
  if (areas === 2) return 'atencao';
  if (areas === 1) return 'monitorar';
  if (hasNoAreaData(child)) return 'sem_dados';
  return 'ok';
}

/**
 * Schema de resposta da criança: a entidade de domínio + campos derivados
 * (`prioridade`, `total_alertas`) calculados no servidor. É o que a API expõe e
 * o que o OpenAPI/`gen:api-types` propaga pros tipos do frontend.
 */
export const childResponseSchema = childSchema
  .extend({
    prioridade: prioridadeSchema,
    total_alertas: z.number().int().nonnegative(),
  })
  .strict();

export type ChildResponse = z.infer<typeof childResponseSchema>;

/** Decora a entidade de domínio com os campos derivados para resposta. */
export function toChildResponse(child: Child): ChildResponse {
  return { ...child, prioridade: derivePriority(child), total_alertas: countAlerts(child) };
}

/** Metadados de paginação da listagem. */
export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

/** Resposta da listagem: página de crianças decoradas + paginação. */
export const listChildrenResultSchema = z.object({
  items: z.array(childResponseSchema),
  pagination: paginationSchema,
});

export type Pagination = z.infer<typeof paginationSchema>;
export type ListChildrenResult = z.infer<typeof listChildrenResultSchema>;
