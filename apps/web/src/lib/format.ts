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
  const refY = now.getUTCFullYear();
  const refM = now.getUTCMonth() + 1;
  const refD = now.getUTCDate();
  let age = refY - y;
  const beforeBirthday = refM < m || (refM === m && refD < d);
  if (beforeBirthday) age--;
  return Math.max(0, age);
}

export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return 'em breve';
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 30) return `há ${diffDays}d`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `há ${months}mês`;
  const years = Math.floor(months / 12);
  return `há ${years}a`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const BAIRRO_COLORS: Record<string, string> = {
  Rocinha: 'bg-amber-500 text-white',
  Maré: 'bg-sky-600 text-white',
  Jacarezinho: 'bg-emerald-600 text-white',
  'Complexo do Alemão': 'bg-rose-600 text-white',
  Mangueira: 'bg-violet-600 text-white',
};

export function bairroAvatarClass(bairro: string): string {
  return BAIRRO_COLORS[bairro] ?? 'bg-slate-600 text-white';
}
