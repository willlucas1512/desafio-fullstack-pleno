import type { AuthTokenResponse } from '../types';
import { apiClient } from './client';

export interface LoginParams {
  email: string;
  password: string;
}

export async function login({ email, password }: LoginParams): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/token', { email, password });
  return data;
}
