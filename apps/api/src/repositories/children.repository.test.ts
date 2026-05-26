import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fixtureChildren } from '../test/fixtures.js';
import { ChildrenRepository } from './children.repository.js';

describe('ChildrenRepository', () => {
  it('list returns all children in original order', () => {
    const repo = new ChildrenRepository(fixtureChildren);
    expect(repo.list().map((c) => c.id)).toEqual(['c001', 'c002', 'c003', 'c004', 'c005']);
  });

  it('findById returns a deep copy (mutating result does not affect store)', () => {
    const repo = new ChildrenRepository(fixtureChildren);
    const c = repo.findById('c001');
    expect(c).not.toBeNull();
    c!.nome = 'MUTATED';
    expect(repo.findById('c001')!.nome).toBe('Ana Clara Mendes');
  });

  it('findById returns null for unknown id', () => {
    const repo = new ChildrenRepository(fixtureChildren);
    expect(repo.findById('zzz')).toBeNull();
  });

  it('markReviewed updates the store', () => {
    const repo = new ChildrenRepository(fixtureChildren);
    repo.markReviewed('c001', 'a@b.test');
    const reloaded = repo.findById('c001');
    expect(reloaded?.revisado).toBe(true);
    expect(reloaded?.revisado_por).toBe('a@b.test');
  });

  it('loads and validates the actual seed.json without throwing', async () => {
    const seedPath = fileURLToPath(new URL('../../../../data/seed.json', import.meta.url));
    const repo = await ChildrenRepository.fromSeedFile(seedPath);
    expect(repo.list().length).toBe(25);
  });
});
