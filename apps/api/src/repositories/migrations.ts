import type pg from 'pg';

export interface Migration {
  version: string;
  sql: string;
}

/**
 * Migrations versionadas e idempotentes, aplicadas em ordem no boot. Mantê-las
 * embutidas (em vez de arquivos .sql soltos) evita problemas de path no runtime
 * do container e deixa o schema versionado junto do código.
 */
export const migrations: Migration[] = [
  {
    version: '001_unaccent_extension',
    // habilita busca por nome/bairro sem acento (unaccent() no WHERE)
    sql: `CREATE EXTENSION IF NOT EXISTS unaccent;`,
  },
  {
    version: '002_children_table',
    sql: `
      CREATE TABLE IF NOT EXISTS children (
        seq                SERIAL,
        id                 TEXT PRIMARY KEY,
        nome               TEXT NOT NULL,
        data_nascimento    TEXT NOT NULL,
        bairro             TEXT NOT NULL,
        responsavel        TEXT NOT NULL,
        saude              JSONB,
        educacao           JSONB,
        assistencia_social JSONB,
        revisado           BOOLEAN NOT NULL DEFAULT false,
        revisado_por       TEXT,
        revisado_em        TIMESTAMPTZ
      );
    `,
  },
  {
    version: '003_children_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_children_bairro ON children (lower(bairro));
      CREATE INDEX IF NOT EXISTS idx_children_revisado ON children (revisado);
    `,
  },
];

/** Cria a tabela de controle e aplica as migrations pendentes, cada uma em transação. */
export async function runMigrations(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query<{ version: string }>('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.version));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
