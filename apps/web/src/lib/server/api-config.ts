/**
 * Configuração server-side do BFF. Estes valores NUNCA chegam ao browser: a URL
 * da API e o cookie de sessão só são usados pelos Route Handlers (`app/api/*`) e
 * pelo middleware. Por isso `API_URL` não tem o prefixo `NEXT_PUBLIC_`.
 */
export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Nome do cookie httpOnly que guarda o JWT. */
export const SESSION_COOKIE = 'painel_session';

interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  expires?: Date;
}

/** Opções do cookie de sessão. Expira junto com o JWT (claim `exp`, em segundos). */
export function sessionCookieOptions(expSeconds?: number): SessionCookieOptions {
  const base: SessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
  return expSeconds ? { ...base, expires: new Date(expSeconds * 1000) } : base;
}
