import { describe, expect, it } from 'vitest';
import { fixtureChildren } from '../test/fixtures.js';
import {
  countMissingAreas,
  hasAnyAlert,
  hasEducationAlerts,
  hasHealthAlerts,
  hasNoAreaData,
  hasSocialAlerts,
  normalize,
} from './child-helpers.js';

const [c001, c002, c003, c004, c005] = fixtureChildren;

describe('alert helpers', () => {
  it('detects health alerts only when present', () => {
    expect(hasHealthAlerts(c001!)).toBe(false);
    expect(hasHealthAlerts(c002!)).toBe(true);
  });

  it('returns false for null areas', () => {
    expect(hasHealthAlerts(c004!)).toBe(false);
    expect(hasEducationAlerts(c004!)).toBe(false);
    expect(hasSocialAlerts(c004!)).toBe(false);
  });

  it('treats empty alertas array as no alerts', () => {
    expect(hasEducationAlerts(c005!)).toBe(false);
  });

  it('hasAnyAlert composes across areas', () => {
    expect(hasAnyAlert(c001!)).toBe(true);
    expect(hasAnyAlert(c004!)).toBe(false);
    expect(hasAnyAlert(c005!)).toBe(false);
  });
});

describe('coverage helpers', () => {
  it('hasNoAreaData only true when all three are null', () => {
    expect(hasNoAreaData(c004!)).toBe(true);
    expect(hasNoAreaData(c003!)).toBe(false);
  });

  it('countMissingAreas tallies null areas', () => {
    expect(countMissingAreas(c001!)).toBe(0);
    expect(countMissingAreas(c003!)).toBe(1);
    expect(countMissingAreas(c004!)).toBe(3);
  });
});

describe('normalize', () => {
  it('strips diacritics and lowercases', () => {
    expect(normalize('Maré')).toBe('mare');
    expect(normalize('Complexo do Alemão')).toBe('complexo do alemao');
  });

  it('treats accented and non-accented variants as equal', () => {
    expect(normalize('MARÉ')).toBe(normalize('mare'));
  });
});
