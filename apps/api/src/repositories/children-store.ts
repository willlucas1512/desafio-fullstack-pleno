import type { ChildrenPage, ListChildrenQuery } from '../domain/child-query.js';
import type { Child } from '../domain/child.js';

/**
 * Abstração de persistência das crianças. Todo o estado vive no Postgres em
 * produção ({@link PostgresChildrenRepository}); os testes unitários usam um
 * fake in-memory que implementa este mesmo contrato. Filtro, ordenação e
 * paginação são responsabilidade do store (SQL em produção), não do serviço.
 */
export interface ChildrenStore {
  list(query: ListChildrenQuery): Promise<ChildrenPage>;
  /** Carrega todas as crianças sem filtro/paginação — usado pela agregação do /summary. */
  listAll(): Promise<Child[]>;
  findById(id: string): Promise<Child | null>;
  markReviewed(id: string, reviewedBy: string): Promise<Child | null>;
  unmarkReviewed(id: string): Promise<Child | null>;
  listNeighborhoods(): Promise<string[]>;
  /** Libera recursos (ex.: pool de conexões). Opcional. */
  close?(): Promise<void>;
}
