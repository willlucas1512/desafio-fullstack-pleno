import { z } from 'zod';
import type { ListChildrenQuery } from '../domain/child-query.js';
import { childSchema, type Child } from '../domain/child.js';
import type { ChildrenStore } from '../repositories/children-store.js';

export {
  listChildrenQuerySchema,
  orderBySchema,
  alertFilterSchema,
  type ListChildrenQuery,
  type OrderBy,
  type AlertFilter,
} from '../domain/child-query.js';

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const listChildrenResultSchema = z.object({
  items: z.array(childSchema),
  pagination: paginationSchema,
});

export type Pagination = z.infer<typeof paginationSchema>;
export type ListChildrenResult = z.infer<typeof listChildrenResultSchema>;

export class ChildrenService {
  constructor(private readonly repo: ChildrenStore) {}

  async list(query: ListChildrenQuery): Promise<ListChildrenResult> {
    const { items, total } = await this.repo.list(query);
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      items,
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages },
    };
  }

  findById(id: string): Promise<Child | null> {
    return this.repo.findById(id);
  }

  markReviewed(id: string, reviewedBy: string): Promise<Child | null> {
    return this.repo.markReviewed(id, reviewedBy);
  }

  unmarkReviewed(id: string): Promise<Child | null> {
    return this.repo.unmarkReviewed(id);
  }

  listNeighborhoods(): Promise<string[]> {
    return this.repo.listNeighborhoods();
  }
}
