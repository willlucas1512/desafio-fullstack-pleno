import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import type {
  AlertFilter,
  ChildrenPage,
  ListChildrenQuery,
  OrderBy,
} from '../domain/child-query.js';
import { childArraySchema, childSchema, type Child } from '../domain/child.js';
import {
  reviewAuditEntrySchema,
  type ReviewAction,
  type ReviewAuditEntry,
} from '../domain/review-audit.js';
import { summarySchema, type Summary } from '../domain/summary.js';
import type { ChildrenStore } from './children-store.js';
import { runMigrations } from './migrations.js';

const { Pool } = pg;

export interface RepoLogger {
  info(obj: unknown, msg?: string): void;
}

interface ChildDocRow {
  data: Child;
}

/** ORDER BY por critério. Strings estáticas (nunca input do usuário). Cada uma
 * termina em `id` p/ desempate estável; COLLATE "C" reproduz a comparação por
 * code point do domínio sobre as chaves já normalizadas. */
const ORDER_SQL: Record<OrderBy, string> = {
  nome: 'nome_norm COLLATE "C" ASC, id COLLATE "C" ASC',
  bairro: 'bairro_norm COLLATE "C" ASC, nome_norm COLLATE "C" ASC, id COLLATE "C" ASC',
  idade: 'data_nascimento COLLATE "C" DESC, id COLLATE "C" ASC',
  revisao: `revisado ASC, COALESCE(revisado_em, '') COLLATE "C" ASC, id COLLATE "C" ASC`,
  alertas: 'alertas_total DESC, nome_norm COLLATE "C" ASC, id COLLATE "C" ASC',
};

/** Predicado WHERE do filtro de alertas (sem parâmetros — valores fixos). */
const ALERT_SQL: Record<AlertFilter, string> = {
  com: 'alertas_total > 0',
  sem: 'alertas_total = 0',
  saude: 'alertas_saude > 0',
  educacao: 'alertas_educacao > 0',
  assistencia_social: 'alertas_social > 0',
};

/** Monta o WHERE parametrizado a partir da query (sem concatenar valores). */
function buildFilter(q: ListChildrenQuery): { where: string; params: Array<string | boolean> } {
  const clauses: string[] = [];
  const params: Array<string | boolean> = [];
  const param = (value: string | boolean): string => {
    params.push(value);
    return `$${params.length}`;
  };

  if (q.nome) clauses.push(`strpos(nome_norm, lower(f_unaccent(btrim(${param(q.nome)})))) > 0`);
  if (q.bairro) clauses.push(`bairro_norm = lower(f_unaccent(btrim(${param(q.bairro)})))`);
  if (q.alertas) clauses.push(ALERT_SQL[q.alertas]);
  if (q.revisado !== undefined) clauses.push(`revisado = ${param(q.revisado)}`);

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

interface TotalsRow {
  total_criancas: number;
  com_alertas: number;
  sem_dados: number;
  revisadas: number;
  alertas_saude: number;
  alertas_educacao: number;
  alertas_social: number;
  com_saude: number;
  com_educacao: number;
  com_social: number;
}

interface BairroRow {
  bairro: string;
  total: number;
  com_alertas: number;
  sem_dados: number;
}

/**
 * Persistência em Postgres. Cada criança é UM documento JSONB (`data`), que
 * segue sendo a ÚNICA superfície de escrita — o schema Zod (`childSchema`) é a
 * definição canônica do formato, então evoluir um campo não-consultável não
 * toca DDL.
 *
 * Filtro, ordenação, paginação e agregação rodam NO BANCO (não mais em memória
 * a cada request): colunas geradas a partir do JSONB (`nome_norm`,
 * `alertas_total`, ...) projetam os campos consultáveis e são indexadas (ver
 * migration 004). A listagem devolve só a página (LIMIT/OFFSET) e apenas essas
 * linhas passam por `childSchema.parse` — sem full-scan nem N validações por
 * chamada. `summary` vira COUNTs agregados; `listNeighborhoods`, um DISTINCT.
 *
 * Este SQL é a ÚNICA implementação de produção das regras de listagem/agregação.
 * O {@link FakeChildrenStore} mantém uma referência in-memory equivalente usada
 * nos testes; o teste de integração (Testcontainers) compara o resultado deste
 * SQL contra o fake sobre o seed, garantindo que as duas concordam.
 */
export class PostgresChildrenRepository implements ChildrenStore {
  private constructor(
    private readonly pool: pg.Pool,
    private readonly logger?: RepoLogger,
  ) {}

  static async create(opts: {
    databaseUrl: string;
    seedPath: string;
    logger?: RepoLogger;
  }): Promise<PostgresChildrenRepository> {
    const pool = new Pool({ connectionString: opts.databaseUrl });
    const repo = new PostgresChildrenRepository(pool, opts.logger);
    await runMigrations(pool);
    await repo.seedIfEmpty(opts.seedPath);
    return repo;
  }

  /** Carrega o seed no banco apenas se a tabela estiver vazia (idempotente). */
  private async seedIfEmpty(seedPath: string): Promise<void> {
    const { rows } = await this.pool.query<{ count: string }>('SELECT count(*) FROM children');
    if (Number(rows[0]?.count ?? 0) > 0) return;

    const raw = await readFile(resolve(seedPath), 'utf-8');
    const seed = childArraySchema.parse(JSON.parse(raw) as unknown);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const c of seed) {
        await client.query('INSERT INTO children (id, data) VALUES ($1, $2::jsonb)', [
          c.id,
          JSON.stringify(c),
        ]);
      }
      await client.query('COMMIT');
      this.logger?.info({ count: seed.length }, 'seed carregado no Postgres');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Carrega todas as crianças sem filtro (uso geral, ex.: testes/paridade). A
   * ordem por `seq` dá só determinismo de inserção; a listagem ordena no SQL. */
  private async loadAll(): Promise<Child[]> {
    const { rows } = await this.pool.query<ChildDocRow>('SELECT data FROM children ORDER BY seq');
    return rows.map((r) => childSchema.parse(r.data));
  }

  /**
   * Filtra/ordena/pagina no banco e valida só a página retornada. O total vem de
   * um COUNT sobre o mesmo WHERE (duas queries: contagem + página).
   */
  async list(query: ListChildrenQuery): Promise<ChildrenPage> {
    const { where, params } = buildFilter(query);

    const totalRes = await this.pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM children ${where}`,
      params,
    );
    const total = totalRes.rows[0]?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const pageRes = await this.pool.query<ChildDocRow>(
      `SELECT data FROM children ${where}
       ORDER BY ${ORDER_SQL[query.orderBy]}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, offset],
    );

    return { items: pageRes.rows.map((r) => childSchema.parse(r.data)), total };
  }

  async listAll(): Promise<Child[]> {
    return this.loadAll();
  }

  /** Indicadores agregados via COUNT/FILTER sobre as colunas geradas. */
  async summary(): Promise<Summary> {
    const totals = await this.pool.query<TotalsRow>(`
      SELECT
        count(*)::int                                                                     AS total_criancas,
        count(*) FILTER (WHERE alertas_total > 0)::int                                     AS com_alertas,
        count(*) FILTER (WHERE NOT tem_saude AND NOT tem_educacao AND NOT tem_social)::int AS sem_dados,
        count(*) FILTER (WHERE revisado)::int                                              AS revisadas,
        count(*) FILTER (WHERE alertas_saude > 0)::int                                     AS alertas_saude,
        count(*) FILTER (WHERE alertas_educacao > 0)::int                                  AS alertas_educacao,
        count(*) FILTER (WHERE alertas_social > 0)::int                                    AS alertas_social,
        count(*) FILTER (WHERE tem_saude)::int                                             AS com_saude,
        count(*) FILTER (WHERE tem_educacao)::int                                          AS com_educacao,
        count(*) FILTER (WHERE tem_social)::int                                            AS com_social
      FROM children
    `);
    const t = totals.rows[0]!;

    const porBairro = await this.pool.query<BairroRow>(`
      WITH agg AS (
        SELECT
          data->>'bairro' AS bairro,
          bairro_norm     AS bnorm,
          count(*)::int                                                                     AS total,
          count(*) FILTER (WHERE alertas_total > 0)::int                                     AS com_alertas,
          count(*) FILTER (WHERE NOT tem_saude AND NOT tem_educacao AND NOT tem_social)::int AS sem_dados
        FROM children
        GROUP BY data->>'bairro', bairro_norm
      )
      SELECT bairro, total, com_alertas, sem_dados
      FROM agg
      ORDER BY bnorm COLLATE "C" ASC, bairro COLLATE "C" ASC
    `);

    return summarySchema.parse({
      total_criancas: t.total_criancas,
      com_alertas: t.com_alertas,
      sem_alertas: t.total_criancas - t.com_alertas - t.sem_dados,
      sem_dados: t.sem_dados,
      revisadas: t.revisadas,
      pendentes_revisao: t.total_criancas - t.revisadas,
      alertas_por_area: {
        saude: t.alertas_saude,
        educacao: t.alertas_educacao,
        assistencia_social: t.alertas_social,
      },
      por_bairro: porBairro.rows,
      cobertura: {
        com_saude: t.com_saude,
        com_educacao: t.com_educacao,
        com_assistencia_social: t.com_social,
        sem_nenhuma_area: t.sem_dados,
      },
    });
  }

  /** Bairros distintos na ordem determinística da listagem (chave normalizada,
   * desempate pelo valor cru) — DISTINCT via GROUP BY pra ordenar por `bairro_norm`. */
  async listNeighborhoods(): Promise<string[]> {
    const { rows } = await this.pool.query<{ bairro: string }>(`
      WITH agg AS (
        SELECT data->>'bairro' AS bairro, bairro_norm AS bnorm
        FROM children
        GROUP BY data->>'bairro', bairro_norm
      )
      SELECT bairro FROM agg
      ORDER BY bnorm COLLATE "C" ASC, bairro COLLATE "C" ASC
    `);
    return rows.map((r) => r.bairro);
  }

  async findById(id: string): Promise<Child | null> {
    const { rows } = await this.pool.query<ChildDocRow>(
      'SELECT data FROM children WHERE id = $1',
      [id],
    );
    return rows[0] ? childSchema.parse(rows[0].data) : null;
  }

  markReviewed(id: string, reviewedBy: string): Promise<Child | null> {
    return this.transitionReview(id, {
      alreadyInState: (child) => child.revisado,
      next: (child) => ({
        ...child,
        revisado: true,
        revisado_por: reviewedBy,
        revisado_em: new Date().toISOString(),
      }),
      action: 'revisado',
      reviewer: reviewedBy,
    });
  }

  unmarkReviewed(id: string): Promise<Child | null> {
    return this.transitionReview(id, {
      alreadyInState: (child) => !child.revisado,
      next: (child) => ({
        ...child,
        revisado: false,
        revisado_por: null,
        revisado_em: null,
      }),
      action: 'revisao_desfeita',
      reviewer: null,
    });
  }

  async reviewHistory(id: string): Promise<ReviewAuditEntry[]> {
    const { rows } = await this.pool.query<{
      action: ReviewAction;
      reviewer: string | null;
      created_at: Date;
    }>(
      `SELECT action, reviewer, created_at FROM review_audit
       WHERE child_id = $1
       ORDER BY created_at DESC, id DESC`,
      [id],
    );
    return rows.map((r) =>
      reviewAuditEntrySchema.parse({
        action: r.action,
        reviewer: r.reviewer,
        timestamp: r.created_at.toISOString(),
      }),
    );
  }

  /**
   * Transição de revisão idempotente e auditada, em transação com `FOR UPDATE`
   * pra serializar mutações concorrentes na mesma criança. Quando o caso já está
   * no estado-alvo (`alreadyInState`), é no-op: não reescreve o documento nem
   * adiciona linha na trilha. Caso contrário, grava o novo documento e a entrada
   * de auditoria na MESMA transação, então estado e histórico nunca divergem.
   */
  private async transitionReview(
    id: string,
    op: {
      alreadyInState: (child: Child) => boolean;
      next: (child: Child) => Child;
      action: ReviewAction;
      reviewer: string | null;
    },
  ): Promise<Child | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<ChildDocRow>(
        'SELECT data FROM children WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const current = childSchema.parse(rows[0].data);
      if (op.alreadyInState(current)) {
        await client.query('COMMIT');
        return current;
      }
      const next = op.next(current);
      await client.query('UPDATE children SET data = $2::jsonb WHERE id = $1', [
        id,
        JSON.stringify(next),
      ]);
      await client.query(
        'INSERT INTO review_audit (child_id, action, reviewer) VALUES ($1, $2, $3)',
        [id, op.action, op.reviewer],
      );
      await client.query('COMMIT');
      return next;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
