'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { login as loginRequest, type LoginParams } from '@/lib/api/auth';
import { decodeJwt, isExpired, type JwtPayload } from '@/lib/auth/jwt';
import { authStorage } from '@/lib/auth/storage';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: JwtPayload | null;
}

export interface UseAuthResult extends AuthState {
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const hydrate = useCallback(() => {
    const token = authStorage.get();
    if (!token) {
      setState({ status: 'unauthenticated', user: null });
      return;
    }
    const payload = decodeJwt(token);
    if (!payload || isExpired(payload)) {
      authStorage.clear();
      setState({ status: 'unauthenticated', user: null });
      return;
    }
    setState({ status: 'authenticated', user: payload });
  }, []);

  useEffect(() => {
    hydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith('painel.')) hydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrate]);

  const login = useCallback(
    async (params: LoginParams) => {
      const { access_token } = await loginRequest(params);
      authStorage.set(access_token);
      hydrate();
    },
    [hydrate],
  );

  const logout = useCallback(() => {
    authStorage.clear();
    setState({ status: 'unauthenticated', user: null });
    router.replace('/login');
  }, [router]);

  return { ...state, login, logout };
}
