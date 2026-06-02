import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import type { AlertFilter, ChildrenPage, ListChildrenQuery, OrderBy } from '../domain/child-query.js';
import { childArraySchema, childSchema, type Child } from '../domain/child.js';
import { summarySchema, type Summary } from '../domain/summary.js';
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
    // Mesma ordem normalizada/determinística da lista (ver child-query.ts).
    const { rows } = await this.pool.query<{ bairro: string }>(
      `SELECT DISTINCT bairro FROM children ORDER BY unaccent(lower(bairro)) COLLATE "C", bairro COLLATE "C"`,
    );
    return rows.map((r) => r.bairro);
  }

  /**
   * Indicadores agregados calculados no banco (espelha `aggregate` de
   * domain/summary.ts). Duas queries: contagens globais via `count(*) FILTER`
   * e o recorte por bairro via `GROUP BY`. A paridade com a definição canônica
   * é travada por teste (Testcontainers).
   */
  async summary(): Promise<Summary> {
    const totals = this.pool.query<TotalsRow>(`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE ${ALERTS_TOTAL} > 0)::int AS com_alertas,
        count(*) FILTER (WHERE ${NO_AREA_DATA})::int AS sem_dados,
        count(*) FILTER (WHERE revisado)::int AS revisadas,
        count(*) FILTER (WHERE ${areaAlerts('saude')} > 0)::int AS alertas_saude,
        count(*) FILTER (WHERE ${areaAlerts('educacao')} > 0)::int AS alertas_educacao,
        count(*) FILTER (WHERE ${areaAlerts('assistencia_social')} > 0)::int AS alertas_social,
        count(*) FILTER (WHERE saude IS NOT NULL)::int AS com_saude,
        count(*) FILTER (WHERE educacao IS NOT NULL)::int AS com_educacao,
        count(*) FILTER (WHERE assistencia_social IS NOT NULL)::int AS com_assistencia_social
      FROM children
    `);
    const byBairro = this.pool.query<BairroRow>(`
      SELECT
        bairro,
        count(*)::int AS total,
        count(*) FILTER (WHERE ${ALERTS_TOTAL} > 0)::int AS com_alertas,
        count(*) FILTER (WHERE ${NO_AREA_DATA})::int AS sem_dados
      FROM children
      GROUP BY bairro
      ORDER BY unaccent(lower(bairro)) COLLATE "C", bairro COLLATE "C"
    `);

    const [{ rows: t }, { rows: b }] = await Promise.all([totals, byBairro]);
    const r = t[0]!;

    return summarySchema.parse({
      total_criancas: r.total,
      com_alertas: r.com_alertas,
      sem_alertas: r.total - r.com_alertas - r.sem_dados,
      sem_dados: r.sem_dados,
      revisadas: r.revisadas,
      pendentes_revisao: r.total - r.revisadas,
      alertas_por_area: {
        saude: r.alertas_saude,
        educacao: r.alertas_educacao,
        assistencia_social: r.alertas_social,
      },
      por_bairro: b.map((row) => ({
        bairro: row.bairro,
        total: row.total,
        com_alertas: row.com_alertas,
        sem_dados: row.sem_dados,
      })),
      cobertura: {
        com_saude: r.com_saude,
        com_educacao: r.com_educacao,
        com_assistencia_social: r.com_assistencia_social,
        sem_nenhuma_area: r.sem_dados,
      },
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

interface TotalsRow {
  total: number;
  com_alertas: number;
  sem_dados: number;
  revisadas: number;
  alertas_saude: number;
  alertas_educacao: number;
  alertas_social: number;
  com_saude: number;
  com_educacao: number;
  com_assistencia_social: number;
}

interface BairroRow {
  bairro: string;
  total: number;
  com_alertas: number;
  sem_dados: number;
}

/** Nº de alertas de UMA área (área ausente conta como zero). */
function areaAlerts(area: 'saude' | 'educacao' | 'assistencia_social'): string {
  return `jsonb_array_length(coalesce(${area}->'alertas', '[]'::jsonb))`;
}

/** Criança sem nenhuma das três áreas (todas NULL). */
const NO_AREA_DATA = `saude IS NULL AND educacao IS NULL AND assistencia_social IS NULL`;

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

// Espelha `compareBy`/`sortChildren` de domain/child-query.ts. `COLLATE "C"`
// dá ordem por code point (== byteCompare no TS) e `id` fecha todo critério
// como desempate estável. A paridade é travada por testes (Testcontainers).
const NAME_KEY = `unaccent(lower(nome)) COLLATE "C"`;
const BAIRRO_KEY = `unaccent(lower(bairro)) COLLATE "C"`;
const ID_TIEBREAK = `id COLLATE "C" ASC`;

function orderClause(orderBy: OrderBy): string {
  switch (orderBy) {
    case 'nome':
      return `ORDER BY ${NAME_KEY} ASC, ${ID_TIEBREAK}`;
    case 'bairro':
      return `ORDER BY ${BAIRRO_KEY} ASC, ${NAME_KEY} ASC, ${ID_TIEBREAK}`;
    case 'idade':
      return `ORDER BY data_nascimento COLLATE "C" DESC, ${ID_TIEBREAK}`;
    case 'revisao':
      return `ORDER BY revisado ASC, revisado_em ASC NULLS FIRST, ${ID_TIEBREAK}`;
    case 'alertas':
    default:
      return `ORDER BY ${ALERTS_TOTAL} DESC, ${NAME_KEY} ASC, ${ID_TIEBREAK}`;
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
