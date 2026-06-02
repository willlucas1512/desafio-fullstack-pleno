import type { ChildrenPage, ListChildrenQuery } from "../domain/child-query.js";
import type { Child } from "../domain/child.js";
import type { ReviewAuditEntry } from "../domain/review-audit.js";
import type { Summary } from "../domain/summary.js";

/**
 * Abstração de persistência das crianças. Os testes unitários usam um
 * fake in-memory que implementa este mesmo contrato.
 */
export interface ChildrenStore {
  list(query: ListChildrenQuery): Promise<ChildrenPage>;
  /** Carrega todas as crianças sem filtro/paginação (uso geral, ex.: testes). */
  listAll(): Promise<Child[]>;
  /** Indicadores agregados do painel — calculados no banco em produção (SQL). */
  summary(): Promise<Summary>;
  findById(id: string): Promise<Child | null>;
  /** Marca como revisado. Idempotente: re-marcar não altera estado nem trilha. */
  markReviewed(id: string, reviewedBy: string): Promise<Child | null>;
  /** Desfaz a revisão. Idempotente: desfazer um caso já não-revisado é no-op. */
  unmarkReviewed(id: string): Promise<Child | null>;
  /** Trilha de auditoria das revisões do caso, mais recente primeiro. */
  reviewHistory(id: string): Promise<ReviewAuditEntry[]>;
  listNeighborhoods(): Promise<string[]>;
  /** Libera recursos (ex.: pool de conexões). Opcional. */
  close?(): Promise<void>;
}
