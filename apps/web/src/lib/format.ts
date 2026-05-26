import type { AlertArea, EducationAlert, HealthAlert, SocialAlert } from './types';

export const ALERT_LABEL: Record<HealthAlert | EducationAlert | SocialAlert, string> = {
  // saúde
  vacinas_atrasadas: 'Vacinas atrasadas',
  consulta_atrasada: 'Consulta atrasada',
  // educação
  frequencia_baixa: 'Frequência baixa',
  matricula_pendente: 'Matrícula pendente',
  // assistência social
  cadastro_ausente: 'CadÚnico ausente',
  cadastro_desatualizado: 'CadÚnico desatualizado',
  beneficio_suspenso: 'Benefício suspenso',
};

export const AREA_LABEL: Record<AlertArea, string> = {
  saude: 'Saúde',
  educacao: 'Educação',
  assistencia_social: 'Assistência social',
};

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ageInYears(dob: string, now: Date = new Date()): number {
  const [y, m, d] = dob.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeBirthday) age--;
  return Math.max(0, age);
}
