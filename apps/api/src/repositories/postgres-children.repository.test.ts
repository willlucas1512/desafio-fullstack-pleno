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
 * Cobre o caminho de produção (Postgres) com um banco real via Testcontainers.
 * Filtro/ordenação/agregação são implementados em SQL aqui; o {@link FakeChildrenStore}
 * mantém a referência in-memory equivalente (já coberta nos testes de serviço/rota).
 * Este arquivo trava a paridade entre as duas: comparamos list/summary/neighborhoods
 * do SQL contra o fake sobre o seed intacto, além de exercitar o I/O em si (seed
 * idempotente, persistência das mutações e o round-trip de mapeamento JSONB).
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

  // --- Round-trip de mapeamento: o caminho real (Postgres + rowToChild) precisa
  // devolver o MESMO resultado da definição canônica em memória (fake). Roda
  // ANTES das mutações, sobre o seed intacto. Isso pega bugs de mapeamento
  // JSONB/timestamp — a lógica de filtro/ordenação em si é coberta à parte.

  // O SQL é a implementação de produção das regras de listagem; o fake in-memory
  // é a referência equivalente. Esta matriz trava a paridade entre os dois sobre
  // o seed: toda ordenação, cada filtro e a paginação.
  const listCases: Array<[string, Record<string, unknown>]> = [
    ['orderBy nome', { orderBy: 'nome', pageSize: 100 }],
    ['orderBy bairro', { orderBy: 'bairro', pageSize: 100 }],
    ['orderBy idade', { orderBy: 'idade', pageSize: 100 }],
    ['orderBy revisao', { orderBy: 'revisao', pageSize: 100 }],
    ['orderBy alertas', { orderBy: 'alertas', pageSize: 100 }],
    ['filtro nome (substring, sem acento)', { nome: 'sa', pageSize: 100 }],
    ['filtro alertas=com', { alertas: 'com', pageSize: 100 }],
    ['filtro alertas=sem', { alertas: 'sem', pageSize: 100 }],
    ['filtro alertas=saude', { alertas: 'saude', pageSize: 100 }],
    ['filtro alertas=educacao', { alertas: 'educacao', pageSize: 100 }],
    ['filtro alertas=assistencia_social', { alertas: 'assistencia_social', pageSize: 100 }],
    ['filtro revisado=false', { revisado: 'false', pageSize: 100 }],
    ['filtro revisado=true', { revisado: 'true', pageSize: 100 }],
    ['paginação (página 2)', { orderBy: 'nome', page: 2, pageSize: 7 }],
  ];

  it('list reflete a definição canônica sobre o seed (ordenações, filtros, paginação)', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    for (const [label, override] of listCases) {
      const q = query(override);
      const fromDb = await repo!.list(q);
      const canon = await fake!.list(q);
      expect(fromDb.total, label).toBe(canon.total);
      expect(fromDb.items, label).toEqual(canon.items);
    }
  });

  it('summary reflete a agregação canônica sobre o seed', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    expect(await repo!.summary()).toEqual(await fake!.summary());
  });

  it('listNeighborhoods reflete a ordem canônica sobre o seed', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    expect(await repo!.listNeighborhoods()).toEqual(await fake!.listNeighborhoods());
  });

  // --- Mutações (depois do round-trip, pois alteram o estado do banco) ---

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

  it('markReviewed é idempotente: re-marcar preserva revisado_em e não duplica a trilha', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const id = (await repo!.listAll())[5]!.id;

    const first = await repo!.markReviewed(id, 'tecnico@prefeitura.rio');
    const again = await repo!.markReviewed(id, 'outro@prefeitura.rio');
    expect(again?.revisado_em).toBe(first?.revisado_em);
    expect(again?.revisado_por).toBe('tecnico@prefeitura.rio');
    expect(await repo!.reviewHistory(id)).toHaveLength(1);
  });

  it('reviewHistory devolve a trilha append-only (mais recente primeiro)', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const id = (await repo!.listAll())[6]!.id;

    await repo!.markReviewed(id, 'tecnico@prefeitura.rio');
    await repo!.unmarkReviewed(id);

    const history = await repo!.reviewHistory(id);
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ action: 'revisao_desfeita', reviewer: null });
    expect(history[1]).toMatchObject({ action: 'revisado', reviewer: 'tecnico@prefeitura.rio' });
    expect(history[0]!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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
