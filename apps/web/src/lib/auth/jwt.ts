export interface JwtPayload {
  preferred_username: string;
  iat: number;
  exp: number;
}
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64.padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), '=');
    // atob (não Buffer) pra rodar igual no browser, no Node e no Edge Runtime
    // (middleware). O payload do JWT é ASCII (email + timestamps).
    const parsed = JSON.parse(atob(padded)) as JwtPayload;
    if (typeof parsed.preferred_username !== 'string') return null;
    if (typeof parsed.exp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  return payload.exp <= nowSeconds;
}
