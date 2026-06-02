import { describe, expect, it } from 'vitest';
import { fixtureChildren } from '../test/fixtures.js';
import { childResponseSchema, derivePriority, toChildResponse } from './child-status.js';
import type { Child } from './child.js';

const byId = (id: string): Child => {
  const child = fixtureChildren.find((c) => c.id === id);
  if (!child) throw new Error(`fixture ${id} ausente`);
  return child;
};

describe('derivePriority', () => {
  it('classifica como critico quando as 3 áreas têm alerta', () => {
    // c005 tem as 3 áreas sem alerta; injetamos um alerta em cada uma.
    const critico: Child = {
      ...byId('c005'),
      saude: { ultima_consulta: null, vacinas_em_dia: false, alertas: ['consulta_atrasada'] },
      educacao: { escola: null, frequencia_percent: 40, alertas: ['frequencia_baixa'] },
      assistencia_social: { cad_unico: false, beneficio_ativo: false, alertas: ['cadastro_ausente'] },
    };
    expect(derivePriority(critico)).toBe('critico');
  });

  it('classifica atencao (2 áreas), monitorar (1 área), sem_dados (nenhuma) e ok', () => {
    expect(derivePriority(byId('c002'))).toBe('atencao'); // saúde + assistência
    expect(derivePriority(byId('c001'))).toBe('monitorar'); // só educação
    expect(derivePriority(byId('c004'))).toBe('sem_dados'); // todas as áreas null
    expect(derivePriority(byId('c005'))).toBe('ok'); // 3 áreas, nenhum alerta
  });
});

describe('toChildResponse', () => {
  it('decora a entidade com prioridade e total_alertas válidos pelo schema', () => {
    const response = toChildResponse(byId('c002'));
    expect(response.prioridade).toBe('atencao');
    expect(response.total_alertas).toBe(3);
    expect(() => childResponseSchema.parse(response)).not.toThrow();
  });
});
