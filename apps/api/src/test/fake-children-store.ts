import { type ChildrenPage, type ListChildrenQuery, queryChildren } from '../domain/child-query.js';
import { normalize } from '../domain/child-helpers.js';
import type { Child } from '../domain/child.js';
import { aggregate, type Summary } from '../domain/summary.js';
import type { ChildrenStore } from '../repositories/children-store.js';

/**
 * Implementação in-memory de {@link ChildrenStore} usada APENAS nos testes
 * unitários — produção é Postgres-only ({@link PostgresChildrenRepository}).
 * Reusa {@link queryChildren} (a definição canônica de filtro/ordenação/paginação)
 * pra exercitar a mesma lógica de listagem sem precisar de banco.
 */
export class FakeChildrenStore implements ChildrenStore {
  private readonly byId: Map<string, Child>;
  private readonly order: string[];

  constructor(initial: Child[]) {
    this.byId = new Map(initial.map((c) => [c.id, structuredClone(c)]));
    this.order = initial.map((c) => c.id);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async list(query: ListChildrenQuery): Promise<ChildrenPage> {
    const page = queryChildren(this.all(), query);
    return { items: page.items.map((c) => structuredClone(c)), total: page.total };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async listAll(): Promise<Child[]> {
    return this.all().map((c) => structuredClone(c));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async summary(): Promise<Summary> {
    return aggregate(this.all());
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findById(id: string): Promise<Child | null> {
    const c = this.byId.get(id);
    return c ? structuredClone(c) : null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async markReviewed(id: string, reviewedBy: string): Promise<Child | null> {
    const c = this.byId.get(id);
    if (!c) return null;
    c.revisado = true;
    c.revisado_por = reviewedBy;
    c.revisado_em = new Date().toISOString();
    return structuredClone(c);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async unmarkReviewed(id: string): Promise<Child | null> {
    const c = this.byId.get(id);
    if (!c) return null;
    c.revisado = false;
    c.revisado_por = null;
    c.revisado_em = null;
    return structuredClone(c);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async listNeighborhoods(): Promise<string[]> {
    // Mesma ordem normalizada/determinística do Postgres (ver child-query.ts).
    return [...new Set(this.all().map((c) => c.bairro))].sort((a, b) => {
      const na = normalize(a);
      const nb = normalize(b);
      if (na < nb) return -1;
      if (na > nb) return 1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }

  private all(): Child[] {
    return this.order
      .map((id) => this.byId.get(id))
      .filter((c): c is Child => c !== undefined);
  }
}
