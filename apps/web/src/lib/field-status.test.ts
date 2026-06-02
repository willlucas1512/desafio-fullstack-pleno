import { describe, expect, it } from 'vitest';
import { resolveFieldStatus } from './field-status';

describe('resolveFieldStatus', () => {
  it('usa o fallback do dado bruto quando não há alerta', () => {
    expect(
      resolveFieldStatus([], [{ code: 'cadastro_ausente', label: 'Ausente' }], {
        tone: 'good',
        label: 'Ativo',
      }),
    ).toEqual({ tone: 'good', label: 'Ativo' });
  });

  it('deixa o alerta curado definir o status quando presente', () => {
    expect(
      resolveFieldStatus(
        ['beneficio_suspenso'],
        [{ code: 'beneficio_suspenso', label: 'Suspenso' }],
        { tone: 'good', label: 'Ativo' },
      ),
    ).toEqual({ tone: 'bad', label: 'Suspenso' });
  });

  it('resolve seed inconsistente (cad_unico=false + cadastro_desatualizado) numa mensagem só', () => {
    // o booleano cru diria "Ausente"; o alerta curado tem precedência → "Desatualizado"
    const status = resolveFieldStatus(
      ['cadastro_desatualizado'],
      [
        { code: 'cadastro_desatualizado', label: 'Desatualizado' },
        { code: 'cadastro_ausente', label: 'Ausente' },
      ],
      { tone: 'bad', label: 'Ausente' },
    );
    expect(status).toEqual({ tone: 'bad', label: 'Desatualizado' });
  });

  it('ignora alertas que não pertencem ao atributo', () => {
    expect(
      resolveFieldStatus(['beneficio_suspenso'], [{ code: 'cadastro_ausente', label: 'Ausente' }], {
        tone: 'good',
        label: 'Ativo',
      }),
    ).toEqual({ tone: 'good', label: 'Ativo' });
  });
});
