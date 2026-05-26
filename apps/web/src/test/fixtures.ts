import type { Child, Summary } from '@/lib/types';

export function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'c001',
    nome: 'Ana Clara Mendes',
    data_nascimento: '2020-03-15',
    bairro: 'Rocinha',
    responsavel: 'Maria Mendes',
    saude: { ultima_consulta: '2025-11-10', vacinas_em_dia: true, alertas: [] },
    educacao: {
      escola: 'CIEP 305 Guilherme Bryan',
      frequencia_percent: 61,
      alertas: ['frequencia_baixa'],
    },
    assistencia_social: { cad_unico: true, beneficio_ativo: true, alertas: [] },
    revisado: false,
    revisado_por: null,
    revisado_em: null,
    ...overrides,
  };
}

export const emptyChild = makeChild({
  id: 'c-empty',
  nome: 'Amanda Sem Dados',
  saude: null,
  educacao: null,
  assistencia_social: null,
});

export const sampleSummary: Summary = {
  total_criancas: 25,
  com_alertas: 17,
  sem_alertas: 7,
  sem_dados: 1,
  revisadas: 4,
  pendentes_revisao: 21,
  alertas_por_area: { saude: 8, educacao: 9, assistencia_social: 8 },
  por_bairro: [
    { bairro: 'Complexo do Alemão', total: 5, com_alertas: 4, sem_dados: 0 },
    { bairro: 'Jacarezinho', total: 5, com_alertas: 4, sem_dados: 0 },
    { bairro: 'Mangueira', total: 5, com_alertas: 2, sem_dados: 1 },
    { bairro: 'Maré', total: 5, com_alertas: 3, sem_dados: 0 },
    { bairro: 'Rocinha', total: 5, com_alertas: 4, sem_dados: 0 },
  ],
  cobertura: {
    com_saude: 23,
    com_educacao: 20,
    com_assistencia_social: 21,
    sem_nenhuma_area: 1,
  },
};
