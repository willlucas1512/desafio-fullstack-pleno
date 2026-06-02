import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { API_URL, SESSION_COOKIE } from '@/lib/server/api-config';

/**
 * Proxy do BFF pras chamadas de dados. O cliente fala same-origin com
 * `/api/proxy/*`; aqui anexamos o JWT do cookie httpOnly como `Bearer` e
 * encaminhamos pra API externa. Assim o token nunca toca o JavaScript do
 * browser e a API continua sendo a fonte de verdade da autorização (valida a
 * assinatura). Se a API responder 401, o cookie é descartado.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, error: 'Unauthorized', message: 'Sessão necessária' },
      { status: 401 },
    );
  }

  const target = `${API_URL}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const init: RequestInit = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const reqBody = await request.text();
    if (reqBody) {
      init.body = reqBody;
      (init.headers as Record<string, string>)['Content-Type'] =
        request.headers.get('content-type') ?? 'application/json';
    }
  }

  const upstream = await fetch(target, init);
  const responseBody = await upstream.text();
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });

  if (upstream.status === 401) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
  handler as PUT,
};
