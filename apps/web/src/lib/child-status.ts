import type { AlertArea, Child, Prioridade } from '@/lib/types';

/**
 * A prioridade do caso (`critico`/`atencao`/`monitorar`/`sem_dados`/`ok`) e o
 * total de alertas são DERIVADOS no servidor e chegam prontos em `child` — a
 * regra mora só no backend (`domain/child-status.ts`). Aqui ficam apenas
 * helpers de apresentação que leem os dados já presentes na entidade.
 */
export type Priority = Prioridade;

export interface AreaAlertCount {
  area: AlertArea;
  count: number;
}

/** Alertas por área (só áreas com count > 0) — usado para renderizar os chips. */
export function alertsByArea(child: Child): AreaAlertCount[] {
  return [
    { area: 'saude' as const, count: child.saude?.alertas.length ?? 0 },
    { area: 'educacao' as const, count: child.educacao?.alertas.length ?? 0 },
    { area: 'assistencia_social' as const, count: child.assistencia_social?.alertas.length ?? 0 },
  ].filter((a) => a.count > 0);
}
