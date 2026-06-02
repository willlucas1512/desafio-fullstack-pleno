import {
  toChildResponse,
  type ChildResponse,
  type ListChildrenResult,
} from "../domain/child-status.js";
import type { ListChildrenQuery } from "../domain/child-query.js";
import type { ReviewAuditEntry } from "../domain/review-audit.js";
import type { Summary } from "../domain/summary.js";
import type { ChildrenStore } from "../repositories/children-store.js";

/**
 * Orquestra a listagem e decora as entidades com os campos (`prioridade`, `total_alertas`).
 */
export class ChildrenService {
  constructor(private readonly repo: ChildrenStore) {}

  async list(query: ListChildrenQuery): Promise<ListChildrenResult> {
    const { items, total } = await this.repo.list(query);
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      items: items.map(toChildResponse),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    };
  }

  summary(): Promise<Summary> {
    return this.repo.summary();
  }

  async findById(id: string): Promise<ChildResponse | null> {
    const child = await this.repo.findById(id);
    return child ? toChildResponse(child) : null;
  }

  async markReviewed(
    id: string,
    reviewedBy: string,
  ): Promise<ChildResponse | null> {
    const child = await this.repo.markReviewed(id, reviewedBy);
    return child ? toChildResponse(child) : null;
  }

  async unmarkReviewed(id: string): Promise<ChildResponse | null> {
    const child = await this.repo.unmarkReviewed(id);
    return child ? toChildResponse(child) : null;
  }

  /** Trilha de auditoria do caso. `null` = criança inexistente (vira 404). */
  async reviewHistory(id: string): Promise<ReviewAuditEntry[] | null> {
    const child = await this.repo.findById(id);
    if (!child) return null;
    return this.repo.reviewHistory(id);
  }

  listNeighborhoods(): Promise<string[]> {
    return this.repo.listNeighborhoods();
  }
}
