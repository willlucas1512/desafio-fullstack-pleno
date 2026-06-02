import type { AlertArea, Child } from '@/lib/types';

export type Priority = 'critico' | 'atencao' | 'monitorar' | 'sem_dados' | 'ok';

export interface AreaAlertCount {
  area: AlertArea;
  count: number;
}

export function alertsByArea(child: Child): AreaAlertCount[] {
  return [
    { area: 'saude' as const, count: child.saude?.alertas.length ?? 0 },
    { area: 'educacao' as const, count: child.educacao?.alertas.length ?? 0 },
    { area: 'assistencia_social' as const, count: child.assistencia_social?.alertas.length ?? 0 },
  ].filter((a) => a.count > 0);
}

export function totalAlerts(child: Child): number {
  return alertsByArea(child).reduce((sum, a) => sum + a.count, 0);
}

export function hasNoAreaData(child: Child): boolean {
  return child.saude === null && child.educacao === null && child.assistencia_social === null;
}

export function getPriority(child: Child): Priority {
  const areas = alertsByArea(child).length;
  if (areas === 3) return 'critico';
  if (areas === 2) return 'atencao';
  if (areas === 1) return 'monitorar';
  if (hasNoAreaData(child)) return 'sem_dados';
  return 'ok';
}
