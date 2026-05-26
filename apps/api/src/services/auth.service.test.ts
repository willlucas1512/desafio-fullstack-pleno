import { describe, expect, it } from 'vitest';
import { createAuthService } from './auth.service.js';
const SAMPLE_EMAIL = 'a@b.test';
const SAMPLE_VALUE = 'x';

describe('AuthService', () => {
  const service = createAuthService({ email: SAMPLE_EMAIL, password: SAMPLE_VALUE });

  it('accepts correct credentials', () => {
    expect(service.authenticate(SAMPLE_EMAIL, SAMPLE_VALUE)).toBe(true);
  });

  it('rejects wrong password', () => {
    expect(service.authenticate(SAMPLE_EMAIL, 'z')).toBe(false);
  });

  it('rejects wrong email', () => {
    expect(service.authenticate('c@d.test', SAMPLE_VALUE)).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(service.authenticate('', '')).toBe(false);
  });

  it('is case-sensitive on email and password', () => {
    const mixed = createAuthService({ email: SAMPLE_EMAIL, password: 'Mixed' });
    expect(mixed.authenticate(SAMPLE_EMAIL.toUpperCase(), 'Mixed')).toBe(false);
    expect(mixed.authenticate(SAMPLE_EMAIL, 'mixed')).toBe(false);
    expect(mixed.authenticate(SAMPLE_EMAIL, 'MIXED')).toBe(false);
  });
});
