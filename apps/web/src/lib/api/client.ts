import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '../auth/storage';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = authStorage.get();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        authStorage.clear();
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
