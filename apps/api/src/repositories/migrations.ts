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
    // A criança inteira é persistida como um único documento JSONB — essa é a
    // ÚNICA superfície de escrita, e o schema Zod (`childSchema`) é a definição
    // canônica do registro. A projeção consultável (colunas geradas + índices)
    // vem na migration 004, derivada deste mesmo documento.
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
  {
    version: '004_children_projection',
    // Filtro/ordenação/paginação/agregação passam a rodar NO BANCO. Como o
    // documento JSONB segue sendo a única coisa que a aplicação escreve, os
    // campos consultáveis são COLUNAS GERADAS (STORED) derivadas de `data` —
    // recomputadas pelo Postgres a cada escrita, nunca preenchidas à mão. Assim
    // a leitura ganha colunas reais e indexáveis sem abrir mão do modelo-
    // documento (evoluir um campo não-consultável continua sendo só Zod).
    //
    // Normalização de texto p/ busca/ordenação: `lower(f_unaccent(...))`.
    // `unaccent` é STABLE (depende do dicionário), então é embrulhado numa
    // função IMMUTABLE (`f_unaccent`) pra poder entrar em coluna gerada/índice.
    // Para PT-BR isso casa com o `normalize` (NFD sem diacrítico) do domínio; a
    // ordenação usa COLLATE "C" pra reproduzir a comparação por code point do JS.
    // O teste de integração compara o SQL contra o domínio sobre o seed e trava
    // qualquer divergência.
    sql: `
      CREATE EXTENSION IF NOT EXISTS unaccent;

      CREATE OR REPLACE FUNCTION public.f_unaccent(text)
        RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
        $fn$ SELECT public.unaccent('public.unaccent', $1) $fn$;

      ALTER TABLE children
        ADD COLUMN nome_norm        TEXT    GENERATED ALWAYS AS (lower(public.f_unaccent(btrim(data->>'nome')))) STORED,
        ADD COLUMN bairro_norm      TEXT    GENERATED ALWAYS AS (lower(public.f_unaccent(btrim(data->>'bairro')))) STORED,
        ADD COLUMN data_nascimento  TEXT    GENERATED ALWAYS AS (data->>'data_nascimento') STORED,
        ADD COLUMN revisado         BOOLEAN GENERATED ALWAYS AS ((data->>'revisado')::boolean) STORED,
        ADD COLUMN revisado_em      TEXT    GENERATED ALWAYS AS (data->>'revisado_em') STORED,
        ADD COLUMN alertas_saude    INT     GENERATED ALWAYS AS (COALESCE(jsonb_array_length(data #> '{saude,alertas}'), 0)) STORED,
        ADD COLUMN alertas_educacao INT     GENERATED ALWAYS AS (COALESCE(jsonb_array_length(data #> '{educacao,alertas}'), 0)) STORED,
        ADD COLUMN alertas_social   INT     GENERATED ALWAYS AS (COALESCE(jsonb_array_length(data #> '{assistencia_social,alertas}'), 0)) STORED,
        ADD COLUMN alertas_total    INT     GENERATED ALWAYS AS (
            COALESCE(jsonb_array_length(data #> '{saude,alertas}'), 0)
          + COALESCE(jsonb_array_length(data #> '{educacao,alertas}'), 0)
          + COALESCE(jsonb_array_length(data #> '{assistencia_social,alertas}'), 0)
        ) STORED,
        ADD COLUMN tem_saude        BOOLEAN GENERATED ALWAYS AS ((data->'saude') <> 'null'::jsonb) STORED,
        ADD COLUMN tem_educacao     BOOLEAN GENERATED ALWAYS AS ((data->'educacao') <> 'null'::jsonb) STORED,
        ADD COLUMN tem_social       BOOLEAN GENERATED ALWAYS AS ((data->'assistencia_social') <> 'null'::jsonb) STORED;

      -- Um índice por caminho de acesso (cada ordenação termina em id p/ ser
      -- determinística e casar o desempate estável do domínio).
      CREATE INDEX children_alertas_idx ON children (alertas_total DESC, nome_norm COLLATE "C", id COLLATE "C");
      CREATE INDEX children_nome_idx    ON children (nome_norm COLLATE "C", id COLLATE "C");
      CREATE INDEX children_bairro_idx  ON children (bairro_norm COLLATE "C", nome_norm COLLATE "C", id COLLATE "C");
      CREATE INDEX children_idade_idx   ON children (data_nascimento COLLATE "C" DESC, id COLLATE "C");
      CREATE INDEX children_revisao_idx ON children (revisado, COALESCE(revisado_em, '') COLLATE "C", id COLLATE "C");
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
