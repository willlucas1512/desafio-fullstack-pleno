import { z } from 'zod';
import { educationAlertSchema, healthAlertSchema, socialAlertSchema } from './alerts.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const isoDateTime = z.string().datetime();

export const healthInfoSchema = z
  .object({
    ultima_consulta: isoDate.nullable(),
    vacinas_em_dia: z.boolean(),
    alertas: z.array(healthAlertSchema),
  })
  .strict();

export const educationInfoSchema = z
  .object({
    escola: z.string().nullable(),
    frequencia_percent: z.number().int().min(0).max(100).nullable(),
    alertas: z.array(educationAlertSchema),
  })
  .strict();

export const socialAssistanceInfoSchema = z
  .object({
    cad_unico: z.boolean(),
    beneficio_ativo: z.boolean(),
    alertas: z.array(socialAlertSchema),
  })
  .strict();

export const childSchema = z
  .object({
    id: z.string().min(1),
    nome: z.string().min(1),
    data_nascimento: isoDate,
    bairro: z.string().min(1),
    responsavel: z.string().min(1),
    saude: healthInfoSchema.nullable(),
    educacao: educationInfoSchema.nullable(),
    assistencia_social: socialAssistanceInfoSchema.nullable(),
    revisado: z.boolean(),
    revisado_por: z.string().email().nullable(),
    revisado_em: isoDateTime.nullable(),
  })
  .strict();

export type HealthInfo = z.infer<typeof healthInfoSchema>;
export type EducationInfo = z.infer<typeof educationInfoSchema>;
export type SocialAssistanceInfo = z.infer<typeof socialAssistanceInfoSchema>;
export type Child = z.infer<typeof childSchema>;

export const childArraySchema = z.array(childSchema);
