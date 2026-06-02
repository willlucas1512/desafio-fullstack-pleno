export interface LoginParams {
  email: string;
  password: string;
}

export interface SessionUser {
  preferred_username: string;
  exp: number;
}

/** Autentica via BFF. Em caso de falha, lança Error com a mensagem da API. */
export async function login(params: LoginParams): Promise<SessionUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => null)) as
    | { user?: SessionUser; message?: string }
    | null;
  if (!res.ok || !data?.user) {
    throw new Error(data?.message ?? 'Não foi possível entrar. Verifique e-mail e senha.');
  }
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

/** Lê o estado da sessão a partir do cookie httpOnly (via BFF). */
export async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/session');
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { user?: SessionUser } | null;
  return data?.user ?? null;
}
