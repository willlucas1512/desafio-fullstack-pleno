import { type SessionUser } from "@/lib/auth/jwt";
import { apiErrorMessage, authClient, httpStatus } from "./client";

export type { SessionUser };

export interface LoginParams {
  email: string;
  password: string;
}

const LOGIN_FALLBACK = "Não foi possível entrar. Verifique e-mail e senha.";

/** Autentica via BFF. Em caso de falha, lança Error com a mensagem da API. */
export async function login(params: LoginParams): Promise<SessionUser> {
  let user: SessionUser | null;
  try {
    const { data } = await authClient.post<{ user: SessionUser | null }>(
      "/login",
      params,
    );
    user = data.user;
  } catch (error) {
    throw new Error(apiErrorMessage(error, LOGIN_FALLBACK));
  }
  if (!user) throw new Error(LOGIN_FALLBACK);
  return user;
}

export async function logout(): Promise<void> {
  await authClient.post("/logout");
}

/** Lê o estado da sessão a partir do cookie httpOnly (via BFF). */
export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const { data } = await authClient.get<{ user: SessionUser | null }>(
      "/session",
    );
    return data.user ?? null;
  } catch (error) {
    // Qualquer resposta HTTP (ex.: 401 sem sessão) significa "não autenticado".
    // Só repropaga falha de rede, onde não houve status.
    if (httpStatus(error) !== undefined) return null;
    throw error;
  }
}

/**
 * Renova a sessão via BFF e distingue:
 *  - `SessionUser`: renovou, reagenda;
 *  - `null` (401/4xx): token não renovável → desloga;
 *  - lança: indisponibilidade transitória (rede ou 5xx) → mantém sessão e tenta depois.
 */
export async function refreshSession(): Promise<SessionUser | null> {
  try {
    const { data } = await authClient.post<{ user: SessionUser | null }>(
      "/refresh",
    );
    return data.user ?? null;
  } catch (error) {
    const status = httpStatus(error);
    if (status === undefined || status >= 500) {
      throw error instanceof Error ? error : new Error("refresh unavailable");
    }
    return null;
  }
}
