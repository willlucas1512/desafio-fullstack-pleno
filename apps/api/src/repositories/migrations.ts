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
    version: '003_children_doc',
    // A criança inteira é persistida como um único documento JSONB. O domínio
    // (Zod) é a definição canônica do registro: adicionar um campo/área é uma
    // mudança só no schema, sem tocar colunas, INSERT ou mapeamento de linha.
    // O banco só dá durabilidade — filtro/ordenação/agregação rodam no domínio,
    // então não há colunas de busca nem índices aqui.
    //
    // O DROP cobre quem tinha o esquema antigo (colunas por campo) num volume
    // remanescente; os dados vêm do seed canônico, então recriar é seguro.
    sql: `
      DROP TABLE IF EXISTS children;
      CREATE TABLE children (
        seq  SERIAL,
        id   TEXT PRIMARY KEY,
        data JSONB NOT NULL
      );
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
