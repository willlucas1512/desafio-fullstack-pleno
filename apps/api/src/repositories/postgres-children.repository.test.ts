import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listChildrenQuerySchema, type ListChildrenQuery } from '../domain/child-query.js';
import { childArraySchema } from '../domain/child.js';
import { FakeChildrenStore } from '../test/fake-children-store.js';
import { PostgresChildrenRepository } from './postgres-children.repository.js';

const seedPath = fileURLToPath(new URL('../../../../data/seed.json', import.meta.url));
const query = (override: Record<string, unknown> = {}): ListChildrenQuery =>
  listChildrenQuerySchema.parse(override);

// Em CI a falta de Docker é erro (não queremos "verde" sem exercitar o caminho
// real do Postgres). Localmente, sem o daemon, a suíte se auto-pula.
const REQUIRE_DOCKER = process.env.CI === 'true' || process.env.CI === '1';

/**
 * Cobre o caminho de produção (Postgres) com um banco real via Testcontainers e
 * trava a PARIDADE com a definição canônica de listagem (`queryChildren`, usada
 * pelo {@link FakeChildrenStore}): para cada ordenação e filtro, o SQL precisa
 * devolver exatamente a mesma sequência de ids e o mesmo total.
 */
describe('PostgresChildrenRepository (Testcontainers)', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let repo: PostgresChildrenRepository | undefined;
  let fake: FakeChildrenStore | undefined;
  let dockerUnavailable = false;

  beforeAll(async () => {
    try {
      container = await new PostgreSqlContainer('postgres:16-alpine').start();
      repo = await PostgresChildrenRepository.create({
        databaseUrl: container.getConnectionUri(),
        seedPath,
      });
      const seed = childArraySchema.parse(JSON.parse(await readFile(seedPath, 'utf-8')) as unknown);
      fake = new FakeChildrenStore(seed);
    } catch (err) {
      const msg = (err as Error).message;
      if (REQUIRE_DOCKER) {
        throw new Error(`Docker é obrigatório em CI para os testes do Postgres: ${msg}`);
      }
      dockerUnavailable = true;
      console.warn(`[pg-it] pulando testes Postgres (Docker indisponível): ${msg}`);
    }
  }, 180_000);

  afterAll(async () => {
    await repo?.close();
    await container?.stop();
  });

  it('semeia o seed.json no banco (25 crianças)', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    expect(await repo!.listAll()).toHaveLength(25);
  });

  it('findById retorna a criança e null para id inexistente', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const first = (await repo!.listAll())[0]!;
    expect((await repo!.findById(first.id))?.id).toBe(first.id);
    expect(await repo!.findById('id-que-nao-existe')).toBeNull();
  });

  // --- Paridade SQL ↔ definição canônica (queryChildren via FakeChildrenStore) ---
  // Roda ANTES das mutações pra comparar os dois lados sobre o mesmo seed intacto.

  const orderings = ['nome', 'bairro', 'idade', 'alertas', 'revisao'] as const;
  const filters = [
    {},
    { alertas: 'com' },
    { alertas: 'sem' },
    { alertas: 'saude' },
    { alertas: 'educacao' },
    { alertas: 'assistencia_social' },
    { revisado: 'true' },
    { revisado: 'false' },
    { nome: 'a' },
    { bairro: 'rocinha' },
  ] as const;

  for (const orderBy of orderings) {
    for (const filter of filters) {
      const label = `${orderBy} + ${JSON.stringify(filter)}`;
      it(`paridade SQL↔canônica: ${label}`, async (ctx) => {
        if (dockerUnavailable) return ctx.skip();
        const q = query({ ...filter, orderBy, pageSize: 100 });
        const sql = await repo!.list(q);
        const canon = await fake!.list(q);
        expect(sql.total).toBe(canon.total);
        expect(sql.items.map((c) => c.id)).toEqual(canon.items.map((c) => c.id));
      });
    }
  }

  it('paridade de paginação: páginas em SQL batem com a definição canônica', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    for (const page of [1, 2, 3]) {
      const q = query({ orderBy: 'nome', page, pageSize: 7 });
      const sql = await repo!.list(q);
      const canon = await fake!.list(q);
      expect(sql.items.map((c) => c.id)).toEqual(canon.items.map((c) => c.id));
    }
  });

  it('paridade de listNeighborhoods', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    expect(await repo!.listNeighborhoods()).toEqual(await fake!.listNeighborhoods());
  });

  it('paridade do summary: agregação SQL bate com a definição canônica', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    expect(await repo!.summary()).toEqual(await fake!.summary());
  });

  // --- Mutações (depois da paridade, pois alteram o estado do banco) ---

  it('markReviewed persiste a revisão no banco', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const id = (await repo!.listAll())[0]!.id;

    const updated = await repo!.markReviewed(id, 'tecnico@prefeitura.rio');
    expect(updated?.revisado).toBe(true);
    expect(updated?.revisado_por).toBe('tecnico@prefeitura.rio');
    expect(updated?.revisado_em).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect((await repo!.findById(id))?.revisado).toBe(true);
  });

  it('unmarkReviewed limpa os campos de revisão', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const id = (await repo!.listAll())[0]!.id;
    await repo!.markReviewed(id, 'tecnico@prefeitura.rio');

    const undone = await repo!.unmarkReviewed(id);
    expect(undone?.revisado).toBe(false);
    expect(undone?.revisado_por).toBeNull();
    expect(undone?.revisado_em).toBeNull();
    expect((await repo!.findById(id))?.revisado).toBe(false);
  });

  it('markReviewed/unmarkReviewed retornam null para id inexistente', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    expect(await repo!.markReviewed('nope', 'tecnico@prefeitura.rio')).toBeNull();
    expect(await repo!.unmarkReviewed('nope')).toBeNull();
  });

  it('seedIfEmpty é idempotente (um segundo boot não duplica os dados)', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const again = await PostgresChildrenRepository.create({
      databaseUrl: container!.getConnectionUri(),
      seedPath,
    });
    try {
      expect(await again.listAll()).toHaveLength(25);
    } finally {
      await again.close();
    }
  });
});
