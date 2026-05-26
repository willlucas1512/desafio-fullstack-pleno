import { z } from 'zod';

export const healthAlertSchema = z.enum(['vacinas_atrasadas', 'consulta_atrasada']);
export const educationAlertSchema = z.enum(['frequencia_baixa', 'matricula_pendente']);
export const socialAlertSchema = z.enum([
  'cadastro_ausente',
  'cadastro_desatualizado',
  'beneficio_suspenso',
]);

export type HealthAlert = z.infer<typeof healthAlertSchema>;
export type EducationAlert = z.infer<typeof educationAlertSchema>;
export type SocialAlert = z.infer<typeof socialAlertSchema>;

export const ALERT_AREAS = ['saude', 'educacao', 'assistencia_social'] as const;
export type AlertArea = (typeof ALERT_AREAS)[number];
