import { describe, expect, it } from 'vitest';
import { ageInYears, formatDateBR, formatDateTimeBR } from './format';

describe('formatDateBR', () => {
  it('formats yyyy-mm-dd to dd/mm/yyyy', () => {
    expect(formatDateBR('2025-11-10')).toBe('10/11/2025');
  });

  it('returns em-dash for null/empty', () => {
    expect(formatDateBR(null)).toBe('—');
    expect(formatDateBR(undefined)).toBe('—');
  });
});

describe('formatDateTimeBR', () => {
  it('renders datetime with day and minute precision', () => {
    const formatted = formatDateTimeBR('2026-02-10T09:14:00Z');
    expect(formatted).toMatch(/10\/02\/2026/);
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it('returns em-dash for null', () => {
    expect(formatDateTimeBR(null)).toBe('—');
  });
});

describe('ageInYears', () => {
  it('computes age before birthday', () => {
    const ref = new Date('2026-03-14T00:00:00Z');
    expect(ageInYears('2020-03-15', ref)).toBe(5);
  });

  it('computes age on/after birthday', () => {
    const ref = new Date('2026-03-15T00:00:00Z');
    expect(ageInYears('2020-03-15', ref)).toBe(6);
  });

  it('never returns negative ages', () => {
    const ref = new Date('2019-01-01T00:00:00Z');
    expect(ageInYears('2020-03-15', ref)).toBe(0);
  });
});
