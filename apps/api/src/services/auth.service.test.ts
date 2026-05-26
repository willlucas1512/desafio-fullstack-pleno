import { describe, expect, it } from 'vitest';
import { createAuthService } from './auth.service.js';

describe('AuthService', () => {
  const service = createAuthService({
    email: 'a@b.test',
    password: 'x',
  });

  it('accepts correct credentials', () => {
    expect(service.authenticate('a@b.test', 'x')).toBe(true);
  });

  it('rejects wrong password', () => {
    expect(service.authenticate('a@b.test', 'errado')).toBe(false);
  });

  it('rejects wrong email', () => {
    expect(service.authenticate('c@d.test', 'x')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(service.authenticate('', '')).toBe(false);
  });

  it('is case-sensitive on email and password', () => {
    expect(service.authenticate('C@D.test', 'x')).toBe(false);
    expect(service.authenticate('a@b.test', 'X')).toBe(false);
  });
});
