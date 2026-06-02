import { z } from 'zod';
import {
  hasAnyAlert,
  hasEducationAlerts,
  hasHealthAlerts,
  hasNoAreaData,
  hasSocialAlerts,
  normalize,
} from './child-helpers.js';
import type { Child } from './child.js';

const count = z.number().int().nonnegative();

export const alertsByAreaSchema = z.object({
  saude: count,
  educacao: count,
  assistencia_social: count,
});

export const alertsByNeighborhoodSchema = z.object({
  bairro: z.string(),
  total: count,
  com_alertas: count,
  sem_dados: count,
});

export const summarySchema = z.object({
  total_criancas: count,
  com_alertas: count,
  sem_alertas: count,
  sem_dados: count,
  revisadas: count,
  pendentes_revisao: count,
  alertas_por_area: alertsByAreaSchema,
  por_bairro: z.array(alertsByNeighborhoodSchema),
  cobertura: z.object({
    com_saude: count,
    com_educacao: count,
    com_assistencia_social: count,
    sem_nenhuma_area: count,
  }),
});

export type AlertsByArea = z.infer<typeof alertsByAreaSchema>;
export type AlertsByNeighborhood = z.infer<typeof alertsByNeighborhoodSchema>;
export type Summary = z.infer<typeof summarySchema>;

/**
 * Definição canônica da agregação do painel. É o que o {@link FakeChildrenStore}
 * usa nos testes; o {@link PostgresChildrenRepository} replica o mesmo resultado
 * em SQL (`count(*) FILTER`/`GROUP BY`) e a paridade é travada por teste.
 *
 * A ordem de `por_bairro` segue a mesma normalização determinística da listagem
 * (ver child-query.ts): chave `normalize(bairro)` comparada por code point.
 */
export function aggregate(children: Child[]): Summary {
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
  const porBairro = new Map<string, { total: number; com_alertas: number; sem_dados: number }>();

  for (const c of children) {
    const alerted = hasAnyAlert(c);
    const missingAll = hasNoAreaData(c);
    if (alerted) comAlertas++;
    if (missingAll) semDados++;
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
      .sort((a, b) => {
        const na = normalize(a.bairro);
        const nb = normalize(b.bairro);
        if (na !== nb) return na < nb ? -1 : 1;
        return a.bairro < b.bairro ? -1 : a.bairro > b.bairro ? 1 : 0;
      }),
    cobertura: {
      com_saude: comSaude,
      com_educacao: comEducacao,
      com_assistencia_social: comSocial,
      sem_nenhuma_area: semDados,
    },
  };
}
