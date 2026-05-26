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
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as JwtPayload;
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
