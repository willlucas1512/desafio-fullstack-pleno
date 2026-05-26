import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { childArraySchema, type Child } from '../domain/child.js';

export class ChildrenRepository {
  private byId: Map<string, Child>;
  private order: string[];

  constructor(initial: Child[]) {
    this.byId = new Map(initial.map((c) => [c.id, structuredClone(c)]));
    this.order = initial.map((c) => c.id);
  }

  static async fromSeedFile(path: string): Promise<ChildrenRepository> {
    const absolute = resolve(path);
    const raw = await readFile(absolute, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    const validated = childArraySchema.parse(parsed);
    return new ChildrenRepository(validated);
  }

  list(): Child[] {
    return this.order
      .map((id) => this.byId.get(id))
      .filter((c): c is Child => c !== undefined)
      .map((c) => structuredClone(c));
  }

  findById(id: string): Child | null {
    const c = this.byId.get(id);
    return c ? structuredClone(c) : null;
  }

  markReviewed(id: string, reviewedBy: string, now: Date = new Date()): Child | null {
    const c = this.byId.get(id);
    if (!c) return null;
    c.revisado = true;
    c.revisado_por = reviewedBy;
    c.revisado_em = now.toISOString();
    return structuredClone(c);
  }
}
