import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import type { AlertFilter, ChildrenPage, ListChildrenQuery, OrderBy } from '../domain/child-query.js';
import { childArraySchema, childSchema, type Child } from '../domain/child.js';
import type { ChildrenStore } from './children-store.js';
import { runMigrations } from './migrations.js';

const { Pool } = pg;

export interface RepoLogger {
  info(obj: unknown, msg?: string): void;
}

interface ChildRow {
  id: string;
  nome: string;
  data_nascimento: string;
  bairro: string;
  responsavel: string;
  saude: Child['saude'];
  educacao: Child['educacao'];
  assistencia_social: Child['assistencia_social'];
  revisado: boolean;
  revisado_por: string | null;
  revisado_em: Date | null;
}

/** Soma dos alertas das três áreas, tratando área ausente (NULL) como zero. */
const ALERTS_TOTAL = `(
  jsonb_array_length(coalesce(saude->'alertas', '[]'::jsonb))
  + jsonb_array_length(coalesce(educacao->'alertas', '[]'::jsonb))
  + jsonb_array_length(coalesce(assistencia_social->'alertas', '[]'::jsonb))
)`;

/**
 * Persistência real em Postgres: TODO o estado vive na tabela `children`. O
 * schema é versionado por migrations e o seed é carregado uma única vez no
 * primeiro boot (idempotente). Filtro, ordenação e paginação rodam em SQL.
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
        await client.query(
          `INSERT INTO children
             (id, nome, data_nascimento, bairro, responsavel,
              saude, educacao, assistencia_social, revisado, revisado_por, revisado_em)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, $11)`,
          [
            c.id,
            c.nome,
            c.data_nascimento,
            c.bairro,
            c.responsavel,
            c.saude === null ? null : JSON.stringify(c.saude),
            c.educacao === null ? null : JSON.stringify(c.educacao),
            c.assistencia_social === null ? null : JSON.stringify(c.assistencia_social),
            c.revisado,
            c.revisado_por,
            c.revisado_em,
          ],
        );
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

  async list(query: ListChildrenQuery): Promise<ChildrenPage> {
    const params: unknown[] = [];
    const bind = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    const where: string[] = [];
    if (query.nome) {
      where.push(`unaccent(lower(nome)) LIKE '%' || unaccent(lower(${bind(query.nome)})) || '%'`);
    }
    if (query.bairro) {
      where.push(`unaccent(lower(bairro)) = unaccent(lower(${bind(query.bairro)}))`);
    }
    if (query.alertas !== undefined) {
      where.push(alertCondition(query.alertas));
    }
    if (query.revisado !== undefined) {
      where.push(`revisado = ${bind(query.revisado)}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limit = bind(query.pageSize);
    const offset = bind((query.page - 1) * query.pageSize);

    const { rows } = await this.pool.query<ChildRow & { total_count: string }>(
      `SELECT *, count(*) OVER() AS total_count
         FROM children
         ${whereSql}
         ${orderClause(query.orderBy)}
         LIMIT ${limit} OFFSET ${offset}`,
      params,
    );

    const total = rows[0] ? Number(rows[0].total_count) : 0;
    return { items: rows.map(rowToChild), total };
  }

  async listAll(): Promise<Child[]> {
    const { rows } = await this.pool.query<ChildRow>('SELECT * FROM children ORDER BY seq');
    return rows.map(rowToChild);
  }

  async findById(id: string): Promise<Child | null> {
    const { rows } = await this.pool.query<ChildRow>('SELECT * FROM children WHERE id = $1', [id]);
    return rows[0] ? rowToChild(rows[0]) : null;
  }

  async markReviewed(id: string, reviewedBy: string): Promise<Child | null> {
    const { rows } = await this.pool.query<ChildRow>(
      `UPDATE children
         SET revisado = true, revisado_por = $2, revisado_em = $3
       WHERE id = $1
       RETURNING *`,
      [id, reviewedBy, new Date()],
    );
    return rows[0] ? rowToChild(rows[0]) : null;
  }

  async unmarkReviewed(id: string): Promise<Child | null> {
    const { rows } = await this.pool.query<ChildRow>(
      `UPDATE children
         SET revisado = false, revisado_por = NULL, revisado_em = NULL
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return rows[0] ? rowToChild(rows[0]) : null;
  }

  async listNeighborhoods(): Promise<string[]> {
    const { rows } = await this.pool.query<{ bairro: string }>(
      'SELECT DISTINCT bairro FROM children ORDER BY bairro',
    );
    return rows.map((r) => r.bairro);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function alertCondition(filter: AlertFilter): string {
  switch (filter) {
    case 'com':
      return `${ALERTS_TOTAL} > 0`;
    case 'sem':
      return `${ALERTS_TOTAL} = 0`;
    case 'saude':
    case 'educacao':
    case 'assistencia_social':
      // `filter` é um literal validado pelo Zod (nome de coluna fixo, sem injeção)
      return `jsonb_array_length(coalesce(${filter}->'alertas', '[]'::jsonb)) > 0`;
  }
}

function orderClause(orderBy: OrderBy): string {
  switch (orderBy) {
    case 'nome':
      return 'ORDER BY unaccent(lower(nome)) ASC';
    case 'bairro':
      return 'ORDER BY unaccent(lower(bairro)) ASC, unaccent(lower(nome)) ASC';
    case 'idade':
      return 'ORDER BY data_nascimento DESC';
    case 'revisao':
      return 'ORDER BY revisado ASC, revisado_em ASC NULLS FIRST';
    case 'alertas':
    default:
      return `ORDER BY ${ALERTS_TOTAL} DESC, unaccent(lower(nome)) ASC`;
  }
}

/** Mapeia uma linha do banco pro domínio e revalida com o schema (guarda drift). */
function rowToChild(row: ChildRow): Child {
  return childSchema.parse({
    id: row.id,
    nome: row.nome,
    data_nascimento: row.data_nascimento,
    bairro: row.bairro,
    responsavel: row.responsavel,
    saude: row.saude,
    educacao: row.educacao,
    assistencia_social: row.assistencia_social,
    revisado: row.revisado,
    revisado_por: row.revisado_por,
    revisado_em: row.revisado_em ? row.revisado_em.toISOString() : null,
  });
}
