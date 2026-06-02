import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listChildrenQuerySchema } from '../domain/child-query.js';
import { PostgresChildrenRepository } from './postgres-children.repository.js';

const seedPath = fileURLToPath(new URL('../../../../data/seed.json', import.meta.url));
const query = (override: Record<string, unknown> = {}) => listChildrenQuerySchema.parse(override);

/**
 * Cobre o caminho de produção (Postgres) com um banco real via Testcontainers.
 * Quando o Docker não está disponível (ex.: máquina local sem o daemon), cada
 * teste se auto-pula em vez de derrubar a suíte — em CI com Docker, roda de fato.
 */
describe('PostgresChildrenRepository (Testcontainers)', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let repo: PostgresChildrenRepository | undefined;
  let dockerUnavailable = false;

  beforeAll(async () => {
    try {
      container = await new PostgreSqlContainer('postgres:16-alpine').start();
      repo = await PostgresChildrenRepository.create({
        databaseUrl: container.getConnectionUri(),
        seedPath,
      });
    } catch (err) {
      dockerUnavailable = true;
      console.warn(`[pg-it] pulando testes Postgres (Docker indisponível): ${(err as Error).message}`);
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

  it('list aplica paginação em SQL e devolve o total da query', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const page = await repo!.list(query({ page: 1, pageSize: 5, orderBy: 'nome' }));
    expect(page.items).toHaveLength(5);
    expect(page.total).toBe(25);

    const page2 = await repo!.list(query({ page: 2, pageSize: 5, orderBy: 'nome' }));
    const overlap = page.items.filter((c) => page2.items.some((o) => o.id === c.id));
    expect(overlap).toHaveLength(0);
  });

  it('list ordena por nome (case/acento-insensível) em SQL', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const { items } = await repo!.list(query({ orderBy: 'nome', pageSize: 100 }));
    const nomes = items.map((c) => c.nome);
    const esperado = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    expect(nomes).toEqual(esperado);
  });

  it('list filtra por nome (substring, sem acento) em SQL', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const all = await repo!.listAll();
    const alvo = all[0]!;
    const trecho = alvo.nome.slice(0, 3).toUpperCase();
    const { items } = await repo!.list(query({ nome: trecho, pageSize: 100 }));
    expect(items.some((c) => c.id === alvo.id)).toBe(true);
    expect(items.every((c) => c.nome.toLowerCase().includes(trecho.toLowerCase()))).toBe(true);
  });

  it('list filtra por com/sem alertas de forma complementar', async (ctx) => {
    if (dockerUnavailable) return ctx.skip();
    const com = await repo!.list(query({ alertas: 'com', pageSize: 100 }));
    const sem = await repo!.list(query({ alertas: 'sem', pageSize: 100 }));
    expect(com.total + sem.total).toBe(25);
  });

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
