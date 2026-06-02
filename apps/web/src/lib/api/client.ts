import axios, { type AxiosInstance } from 'axios';

// Same-origin: as chamadas passam pelo proxy do BFF (`/api/proxy`), que anexa o
// JWT do cookie httpOnly no servidor. O browser não vê nem manda o token — o
// cookie viaja sozinho por ser same-origin.
const baseURL = '/api/proxy';

export class UnauthorizedError extends Error {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (httpStatus(error) === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?next=${next}&reason=expired`;
        }
        return Promise.reject(new UnauthorizedError());
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();

/**
 * Cliente das rotas de autenticação do BFF (`/api/auth/*`). Separado do
 * `apiClient` de propósito: NÃO tem o interceptor de 401→redirect, porque login
 * e checagem de sessão tratam o 401 como fluxo normal (credencial inválida /
 * sessão ausente), não como "expirou, mande pro login".
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: '/api/auth',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Status HTTP de um erro do axios, ou undefined se foi falha de rede/outro erro. */
export function httpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Mensagem de erro amigável: prioriza `message` da resposta da API, com fallback. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined;
    if (typeof data?.message === 'string') return data.message;
  }
  return fallback;
}
