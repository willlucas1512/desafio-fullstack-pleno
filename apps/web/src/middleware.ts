import { type NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/server/api-config';

const PROTECTED_PREFIXES = ['/dashboard', '/children'];

/**
 * Proteção de rotas no servidor (Edge): decide o acesso antes de qualquer JS do
 * cliente rodar. Decodifica o JWT do cookie só pra checar presença e expiração —
 * a validação da assinatura é responsabilidade da API (em cada chamada via
 * `/api/proxy`). Um cookie forjado passaria aqui mas seria rejeitado pela API,
 * então nenhum dado vaza.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const authenticated = readSession(request.cookies.get(SESSION_COOKIE)?.value) !== null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/children/:path*', '/login'],
};
