import { beforeEach, describe, expect, it } from 'vitest';
import { ChildrenRepository } from '../repositories/children.repository.js';
import { fixtureChildren } from '../test/fixtures.js';
import { ChildrenService, listChildrenQuerySchema } from './children.service.js';

const defaultQuery = (override: Record<string, unknown> = {}) =>
  listChildrenQuerySchema.parse(override);

describe('ChildrenService.list', () => {
  let service: ChildrenService;

  beforeEach(() => {
    service = new ChildrenService(new ChildrenRepository(fixtureChildren));
  });

  it('returns all items unfiltered with default pagination', () => {
    const result = service.list(defaultQuery());
    expect(result.items).toHaveLength(5);
    expect(result.pagination).toEqual({ page: 1, pageSize: 10, total: 5, totalPages: 1 });
  });

  it('filters by nome (substring, case- and accent-insensitive)', () => {
    expect(
      service.list(defaultQuery({ nome: 'ana' })).items.map((c) => c.id),
    ).toEqual(['c001']);
    expect(service.list(defaultQuery({ nome: 'SOFIA' })).items.map((c) => c.id)).toEqual(['c003']);
    expect(service.list(defaultQuery({ nome: 'xx' })).items).toHaveLength(0);
  });

  it('sorts by alertas DESC by default (mais alertas primeiro)', () => {
    const result = service.list(defaultQuery());
    // c002 tem 3 alertas, c001 e c003 têm 1, c004 c005 sem alertas
    expect(result.items[0]?.id).toBe('c002');
  });

  it('sorts by nome ASC when requested', () => {
    const result = service.list(defaultQuery({ orderBy: 'nome' }));
    expect(result.items.map((c) => c.nome)).toEqual([
      'Amanda Torres',
      'Ana Clara Mendes',
      'Lucas Santos',
      'Pedro Henrique',
      'Sofia Lima',
    ]);
  });

  it('filters by bairro (case- and accent-insensitive)', () => {
    expect(service.list(defaultQuery({ bairro: 'rocinha' })).items).toHaveLength(2);
    expect(service.list(defaultQuery({ bairro: 'MARÉ' })).items).toHaveLength(1);
    expect(service.list(defaultQuery({ bairro: 'mare' })).items).toHaveLength(1);
  });

  it('filters by com/sem alertas', () => {
    const com = service.list(defaultQuery({ alertas: 'com' }));
    const sem = service.list(defaultQuery({ alertas: 'sem' }));
    expect(com.items.map((c) => c.id).sort()).toEqual(['c001', 'c002', 'c003']);
    expect(sem.items.map((c) => c.id).sort()).toEqual(['c004', 'c005']);
  });

  it('filters by specific alert area', () => {
    expect(service.list(defaultQuery({ alertas: 'saude' })).items.map((c) => c.id)).toEqual([
      'c002',
    ]);
    expect(service.list(defaultQuery({ alertas: 'educacao' })).items.map((c) => c.id)).toEqual([
      'c001',
    ]);
    expect(
      service.list(defaultQuery({ alertas: 'assistencia_social' })).items.map((c) => c.id),
    ).toEqual(['c002', 'c003']);
  });

  it('filters by revisado status', () => {
    expect(service.list(defaultQuery({ revisado: 'true' })).items.map((c) => c.id)).toEqual([
      'c003',
    ]);
    expect(service.list(defaultQuery({ revisado: 'false' })).items).toHaveLength(4);
  });

  it('paginates results', () => {
    const opts = { pageSize: 2, orderBy: 'nome' as const };
    const page1 = service.list(defaultQuery({ ...opts, page: 1 }));
    const page2 = service.list(defaultQuery({ ...opts, page: 2 }));
    const page3 = service.list(defaultQuery({ ...opts, page: 3 }));
    expect(page1.items.map((c) => c.nome)).toEqual(['Amanda Torres', 'Ana Clara Mendes']);
    expect(page2.items.map((c) => c.nome)).toEqual(['Lucas Santos', 'Pedro Henrique']);
    expect(page3.items.map((c) => c.nome)).toEqual(['Sofia Lima']);
    expect(page1.pagination).toEqual({ page: 1, pageSize: 2, total: 5, totalPages: 3 });
  });

  it('returns empty page beyond range without crashing', () => {
    const result = service.list(defaultQuery({ pageSize: 2, page: 99 }));
    expect(result.items).toEqual([]);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('composes multiple filters', () => {
    const result = service.list(defaultQuery({ bairro: 'Rocinha', alertas: 'com' }));
    expect(result.items.map((c) => c.id)).toEqual(['c001', 'c003']);
  });
});

describe('ChildrenService.markReviewed', () => {
  it('marks child as reviewed with timestamp and reviewer', () => {
    const service = new ChildrenService(new ChildrenRepository(fixtureChildren));
    const before = service.findById('c001');
    expect(before?.revisado).toBe(false);

    const updated = service.markReviewed('c001', 'a@b.test');
    expect(updated?.revisado).toBe(true);
    expect(updated?.revisado_por).toBe('a@b.test');
    expect(updated?.revisado_em).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns null for unknown id', () => {
    const service = new ChildrenService(new ChildrenRepository(fixtureChildren));
    expect(service.markReviewed('does-not-exist', 'x@y.com')).toBeNull();
  });
});

describe('ChildrenService.listNeighborhoods', () => {
  it('returns unique sorted neighborhoods', () => {
    const service = new ChildrenService(new ChildrenRepository(fixtureChildren));
    expect(service.listNeighborhoods()).toEqual(['Mangueira', 'Maré', 'Rocinha']);
  });
});
