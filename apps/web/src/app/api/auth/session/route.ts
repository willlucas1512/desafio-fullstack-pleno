import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/server/api-config';

/**
 * Estado da sessão pro cliente. Lê o cookie httpOnly (que o JS não enxerga) e
 * devolve só os dados públicos do usuário + expiração — nunca o token em si.
 */
export async function GET(): Promise<NextResponse> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = readSession(token);

  if (!user) {
    if (token) jar.delete(SESSION_COOKIE);
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
