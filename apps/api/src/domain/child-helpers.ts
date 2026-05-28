import type { AlertArea } from './alerts.js';
import type { Child } from './child.js';

export function hasHealthAlerts(child: Child): boolean {
  return child.saude !== null && child.saude.alertas.length > 0;
}

export function hasEducationAlerts(child: Child): boolean {
  return child.educacao !== null && child.educacao.alertas.length > 0;
}

export function hasSocialAlerts(child: Child): boolean {
  return child.assistencia_social !== null && child.assistencia_social.alertas.length > 0;
}

export function hasAlertsIn(child: Child, area: AlertArea): boolean {
  switch (area) {
    case 'saude':
      return hasHealthAlerts(child);
    case 'educacao':
      return hasEducationAlerts(child);
    case 'assistencia_social':
      return hasSocialAlerts(child);
  }
}

export function hasAnyAlert(child: Child): boolean {
  return hasHealthAlerts(child) || hasEducationAlerts(child) || hasSocialAlerts(child);
}

export function countAlerts(child: Child): number {
  return (
    (child.saude?.alertas.length ?? 0) +
    (child.educacao?.alertas.length ?? 0) +
    (child.assistencia_social?.alertas.length ?? 0)
  );
}
export function hasNoAreaData(child: Child): boolean {
  return child.saude === null && child.educacao === null && child.assistencia_social === null;
}

export function countMissingAreas(child: Child): number {
  let count = 0;
  if (child.saude === null) count++;
  if (child.educacao === null) count++;
  if (child.assistencia_social === null) count++;
  return count;
}

const DIACRITICS = /[̀-ͯ]/g;

export function normalize(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim();
}
