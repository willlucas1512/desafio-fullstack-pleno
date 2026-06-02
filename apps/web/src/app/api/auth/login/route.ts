import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decodeJwt } from '@/lib/auth/jwt';
import { API_URL, SESSION_COOKIE, sessionCookieOptions } from '@/lib/server/api-config';

/**
 * Login do BFF: recebe as credenciais, autentica contra a API externa e guarda o
 * JWT num cookie httpOnly. O token nunca é exposto ao JavaScript do browser —
 * some XSS não consegue lê-lo, e o cookie viaja sozinho nas chamadas same-origin
 * proxiadas por `/api/proxy`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const upstream = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = (await upstream.json().catch(() => null)) as
    | { access_token?: string; message?: string }
    | null;

  if (!upstream.ok || !data?.access_token) {
    return NextResponse.json(data ?? { message: 'Falha na autenticação' }, {
      status: upstream.status === 200 ? 502 : upstream.status,
    });
  }

  const payload = decodeJwt(data.access_token);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, data.access_token, sessionCookieOptions(payload?.exp));

  return NextResponse.json({
    user: payload ? { preferred_username: payload.preferred_username, exp: payload.exp } : null,
  });
}
