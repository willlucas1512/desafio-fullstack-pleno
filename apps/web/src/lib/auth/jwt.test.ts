import { describe, expect, it } from 'vitest';
import { decodeJwt, isExpired } from './jwt';

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

describe('decodeJwt', () => {
  it('returns the payload for a well-formed token', () => {
    const token = makeToken({
      preferred_username: 'a@b.test',
      iat: 1000,
      exp: 2000,
    });
    const payload = decodeJwt(token);
    expect(payload).toEqual({
      preferred_username: 'a@b.test',
      iat: 1000,
      exp: 2000,
    });
  });

  it('returns null for tokens with the wrong number of segments', () => {
    expect(decodeJwt('not.a.jwt.token')).toBeNull();
    expect(decodeJwt('justonepart')).toBeNull();
  });

  it('returns null when required claims are missing or wrong type', () => {
    const noUsername = makeToken({ exp: 2000 });
    expect(decodeJwt(noUsername)).toBeNull();
    const noExp = makeToken({ preferred_username: 'x@y.com' });
    expect(decodeJwt(noExp)).toBeNull();
  });

  it('returns null for invalid base64', () => {
    expect(decodeJwt('a.~~~~.c')).toBeNull();
  });
});

describe('isExpired', () => {
  it('treats tokens at or past the expiry as expired', () => {
    expect(isExpired({ preferred_username: 'x', iat: 0, exp: 100 }, 100)).toBe(true);
    expect(isExpired({ preferred_username: 'x', iat: 0, exp: 99 }, 100)).toBe(true);
    expect(isExpired({ preferred_username: 'x', iat: 0, exp: 101 }, 100)).toBe(false);
  });
});
