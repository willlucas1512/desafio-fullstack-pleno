import { z } from 'zod';
import { ALERT_AREAS, type AlertArea } from '../domain/alerts.js';
import { hasAlertsIn, hasAnyAlert, normalize } from '../domain/child-helpers.js';
import type { Child } from '../domain/child.js';
import type { ChildrenRepository } from '../repositories/children.repository.js';

export const alertFilterSchema = z.enum(['com', 'sem', ...ALERT_AREAS]);
export type AlertFilter = z.infer<typeof alertFilterSchema>;

export const listChildrenQuerySchema = z.object({
  bairro: z.string().trim().min(1).optional(),
  alertas: alertFilterSchema.optional(),
  revisado: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type ListChildrenQuery = z.infer<typeof listChildrenQuerySchema>;

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListChildrenResult {
  items: Child[];
  pagination: Pagination;
}

export class ChildrenService {
  constructor(private readonly repo: ChildrenRepository) {}

  list(query: ListChildrenQuery): ListChildrenResult {
    const filtered = this.repo.list().filter((child) => matchesFilters(child, query));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const start = (query.page - 1) * query.pageSize;
    const items = filtered.slice(start, start + query.pageSize);

    return {
      items,
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages },
    };
  }

  findById(id: string): Child | null {
    return this.repo.findById(id);
  }

  markReviewed(id: string, reviewedBy: string): Child | null {
    return this.repo.markReviewed(id, reviewedBy);
  }

  listNeighborhoods(): string[] {
    const all = new Set<string>();
    for (const child of this.repo.list()) all.add(child.bairro);
    return [...all].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }
}

function matchesFilters(child: Child, q: ListChildrenQuery): boolean {
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
