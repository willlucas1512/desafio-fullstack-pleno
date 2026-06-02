export interface JwtPayload {
  preferred_username: string;
  iat: number;
  exp: number;
}

export interface SessionUser {
  preferred_username: string;
  exp: number;
}

/** Projeta o payload do JWT nos claims públicos da sessão. */
export function toSessionUser(payload: JwtPayload): SessionUser {
  return { preferred_username: payload.preferred_username, exp: payload.exp };
}
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64.padEnd(
      payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
      "=",
    );
    const parsed = JSON.parse(atob(padded)) as JwtPayload;
    if (typeof parsed.preferred_username !== "string") return null;
    if (typeof parsed.exp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isExpired(
  payload: JwtPayload,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  return payload.exp <= nowSeconds;
}

export function readSession(
  token: string | undefined,
  nowSeconds?: number,
): SessionUser | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || isExpired(payload, nowSeconds)) return null;
  return toSessionUser(payload);
}
