import { z } from "zod";

/**
 * Contrato dos indicadores agregados do painel.
 */
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
