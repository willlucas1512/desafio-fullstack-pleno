import type { EducationAlert, HealthAlert, SocialAlert } from './types';

type AnyAlert = HealthAlert | EducationAlert | SocialAlert;

export type FieldTone = 'good' | 'bad' | 'neutral';

export interface FieldStatusValue {
  tone: FieldTone;
  label: string;
}

/** Alerta que "pertence" a um atributo, com o rótulo curto a exibir no campo. */
export interface OwnedAlert {
  code: AnyAlert;
  label: string;
}

/**
 * Status de um atributo, com precedência do alerta curado sobre o dado bruto:
 * havendo alerta pro atributo, ele define o status; senão usa o `fallback`.
 * Resolve seed inconsistente — ex.: `cad_unico: false` + `cadastro_desatualizado`
 * mostra só "Desatualizado". O rótulo vem no `OwnedAlert` porque a forma curta
 * depende do campo ("Atrasadas" dentro do bloco "Vacinas").
 */
export function resolveFieldStatus(
  alertas: readonly AnyAlert[],
  owned: readonly OwnedAlert[],
  fallback: FieldStatusValue,
): FieldStatusValue {
  const hit = owned.find((o) => alertas.includes(o.code));
  if (hit) return { tone: 'bad', label: hit.label };
  return fallback;
}
