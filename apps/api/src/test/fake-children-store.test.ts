import { describe, expect, it } from 'vitest';
import { FakeChildrenStore } from './fake-children-store.js';
import { fixtureChildren } from './fixtures.js';

const summaryOf = () => new FakeChildrenStore(fixtureChildren).summary();

describe('FakeChildrenStore.summary (referência in-memory da agregação)', () => {
  it('aggregates totals across the fixture', async () => {
    const summary = await summaryOf();
    expect(summary.total_criancas).toBe(5);
    expect(summary.com_alertas).toBe(3); // c001, c002, c003
    expect(summary.sem_dados).toBe(1); // c004 (all areas null)
    expect(summary.sem_alertas).toBe(1); // c005
    expect(summary.revisadas).toBe(1); // c003
    expect(summary.pendentes_revisao).toBe(4);
  });

  it('counts alerts per area independently of other areas', async () => {
    const { alertas_por_area } = await summaryOf();
    expect(alertas_por_area).toEqual({
      saude: 1, // c002
      educacao: 1, // c001
      assistencia_social: 2, // c002, c003
    });
  });

  it('reports coverage gaps per area', async () => {
    const { cobertura } = await summaryOf();
    expect(cobertura).toEqual({
      com_saude: 4, // all except c004
      com_educacao: 3, // not c003, c004
      com_assistencia_social: 4, // not c004
      sem_nenhuma_area: 1, // c004
    });
  });

  it('groups by bairro alphabetically', async () => {
    const { por_bairro } = await summaryOf();
    expect(por_bairro.map((b) => b.bairro)).toEqual(['Mangueira', 'Maré', 'Rocinha']);
    expect(por_bairro.find((b) => b.bairro === 'Mangueira')).toEqual({
      bairro: 'Mangueira',
      total: 2,
      com_alertas: 0,
      sem_dados: 1,
    });
  });

  it('separates sem_alertas from sem_dados (key business rule)', async () => {
    const { com_alertas, sem_alertas, sem_dados, total_criancas } = await summaryOf();
    expect(com_alertas + sem_alertas + sem_dados).toBe(total_criancas);
  });
});
