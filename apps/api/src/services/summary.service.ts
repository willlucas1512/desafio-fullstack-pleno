import {
  countMissingAreas,
  hasAnyAlert,
  hasEducationAlerts,
  hasHealthAlerts,
  hasNoAreaData,
  hasSocialAlerts,
} from '../domain/child-helpers.js';
import type { Child } from '../domain/child.js';
import type { ChildrenRepository } from '../repositories/children.repository.js';

export interface AlertsByArea {
  saude: number;
  educacao: number;
  assistencia_social: number;
}

export interface AlertsByNeighborhood {
  bairro: string;
  total: number;
  com_alertas: number;
  sem_dados: number;
}

export interface Summary {
  total_criancas: number;
  com_alertas: number;
  sem_alertas: number;
  sem_dados: number;
  revisadas: number;
  pendentes_revisao: number;
  alertas_por_area: AlertsByArea;
  por_bairro: AlertsByNeighborhood[];
  cobertura: {
    com_saude: number;
    com_educacao: number;
    com_assistencia_social: number;
    sem_nenhuma_area: number;
  };
}

export class SummaryService {
  constructor(private readonly repo: ChildrenRepository) {}

  build(): Summary {
    const children = this.repo.list();
    return aggregate(children);
  }
}

function aggregate(children: Child[]): Summary {
  const total = children.length;
  let comAlertas = 0;
  let semDados = 0;
  let revisadas = 0;
  let alertasSaude = 0;
  let alertasEducacao = 0;
  let alertasSocial = 0;
  let comSaude = 0;
  let comEducacao = 0;
  let comSocial = 0;
  let semNenhumaArea = 0;
  const porBairro = new Map<string, { total: number; com_alertas: number; sem_dados: number }>();

  for (const c of children) {
    const alerted = hasAnyAlert(c);
    const missingAll = hasNoAreaData(c);
    if (alerted) comAlertas++;
    if (missingAll) semNenhumaArea++;
    if (countMissingAreas(c) === 3) semDados++;
    if (c.revisado) revisadas++;
    if (hasHealthAlerts(c)) alertasSaude++;
    if (hasEducationAlerts(c)) alertasEducacao++;
    if (hasSocialAlerts(c)) alertasSocial++;
    if (c.saude !== null) comSaude++;
    if (c.educacao !== null) comEducacao++;
    if (c.assistencia_social !== null) comSocial++;

    const bucket = porBairro.get(c.bairro) ?? { total: 0, com_alertas: 0, sem_dados: 0 };
    bucket.total++;
    if (alerted) bucket.com_alertas++;
    if (missingAll) bucket.sem_dados++;
    porBairro.set(c.bairro, bucket);
  }

  return {
    total_criancas: total,
    com_alertas: comAlertas,
    sem_alertas: total - comAlertas - semDados,
    sem_dados: semDados,
    revisadas,
    pendentes_revisao: total - revisadas,
    alertas_por_area: {
      saude: alertasSaude,
      educacao: alertasEducacao,
      assistencia_social: alertasSocial,
    },
    por_bairro: [...porBairro.entries()]
      .map(([bairro, v]) => ({ bairro, ...v }))
      .sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR')),
    cobertura: {
      com_saude: comSaude,
      com_educacao: comEducacao,
      com_assistencia_social: comSocial,
      sem_nenhuma_area: semNenhumaArea,
    },
  };
}
