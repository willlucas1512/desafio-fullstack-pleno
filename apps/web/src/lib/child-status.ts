import type { AlertArea, Child, Prioridade } from "@/lib/types";

export type Priority = Prioridade;

export interface AreaAlertCount {
  area: AlertArea;
  count: number;
}

/** Alertas por área (só áreas com count > 0) */
export function alertsByArea(child: Child): AreaAlertCount[] {
  return [
    { area: "saude" as const, count: child.saude?.alertas.length ?? 0 },
    { area: "educacao" as const, count: child.educacao?.alertas.length ?? 0 },
    {
      area: "assistencia_social" as const,
      count: child.assistencia_social?.alertas.length ?? 0,
    },
  ].filter((a) => a.count > 0);
}
