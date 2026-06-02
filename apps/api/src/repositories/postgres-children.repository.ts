import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import {
  listNeighborhoods,
  queryChildren,
  type ChildrenPage,
  type ListChildrenQuery,
} from '../domain/child-query.js';
import { childArraySchema, childSchema, type Child } from '../domain/child.js';
import { aggregate, type Summary } from '../domain/summary.js';
import type { ChildrenStore } from './children-store.js';
import { runMigrations } from './migrations.js';

const { Pool } = pg;

export interface RepoLogger {
  info(obj: unknown, msg?: string): void;
}

interface ChildDocRow {
  data: Child;
}

/**
 * Persistência em Postgres: cada criança é UM documento JSONB (`data`). O banco
 * só dá durabilidade entre restarts — filtro, ordenação, paginação e agregação
 * NÃO vivem aqui, são delegados ao domínio (`queryChildren`, `aggregate`,
 * `listNeighborhoods`), a MESMA lógica que o fake de testes usa.
 *
 * Guardar o registro inteiro como JSONB (em vez de coluna por campo) encurta o
 * custo de evolução: o schema Zod (`childSchema`) é a única definição do
 * formato, então adicionar campo/área não toca DDL, INSERT nem mapeamento de
 * linha. Toda leitura revalida com `childSchema.parse`, guardando contra drift.
 * Como o seed tem 25 crianças (read-mostly), carregar tudo e processar em
 * memória é trivial e elimina a duplicação SQL↔TS.
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

  /** Carrega todas as crianças do banco. Ordem por `seq` só dá determinismo a
   * `listAll`; `queryChildren`/`aggregate` reordenam por conta. */
  private async loadAll(): Promise<Child[]> {
    const { rows } = await this.pool.query<ChildDocRow>('SELECT data FROM children ORDER BY seq');
    return rows.map((r) => childSchema.parse(r.data));
  }

  async list(query: ListChildrenQuery): Promise<ChildrenPage> {
    return queryChildren(await this.loadAll(), query);
  }

  async listAll(): Promise<Child[]> {
    return this.loadAll();
  }

  async summary(): Promise<Summary> {
    return aggregate(await this.loadAll());
  }

  async listNeighborhoods(): Promise<string[]> {
    return listNeighborhoods(await this.loadAll());
  }

  async findById(id: string): Promise<Child | null> {
    const { rows } = await this.pool.query<ChildDocRow>(
      'SELECT data FROM children WHERE id = $1',
      [id],
    );
    return rows[0] ? childSchema.parse(rows[0].data) : null;
  }

  markReviewed(id: string, reviewedBy: string): Promise<Child | null> {
    return this.update(id, (child) => ({
      ...child,
      revisado: true,
      revisado_por: reviewedBy,
      revisado_em: new Date().toISOString(),
    }));
  }

  unmarkReviewed(id: string): Promise<Child | null> {
    return this.update(id, (child) => ({
      ...child,
      revisado: false,
      revisado_por: null,
      revisado_em: null,
    }));
  }

  /**
   * Read-modify-write de um documento, em transação com `FOR UPDATE` pra
   * serializar mutações concorrentes na mesma criança. Como o registro é um
   * único JSONB, qualquer mutação de campo passa por aqui.
   */
  private async update(id: string, mutate: (child: Child) => Child): Promise<Child | null> {
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
      const next = mutate(childSchema.parse(rows[0].data));
      await client.query('UPDATE children SET data = $2::jsonb WHERE id = $1', [
        id,
        JSON.stringify(next),
      ]);
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
