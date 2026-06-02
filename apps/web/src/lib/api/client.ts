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
      if (axios.isAxiosError(error) && error.response?.status === 401) {
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
