'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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

const AuthContext = createContext<UseAuthResult | null>(null);

// setTimeout usa int de 32 bits; limita o atraso para evitar overflow (dispara antes e re-hidrata).
const MAX_TIMEOUT_MS = 2_147_483_647;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  const hydrate = useCallback(() => {
    clearExpiryTimer();
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
    // agenda a transição para "unauthenticated" no exato momento da expiração
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    expiryTimer.current = setTimeout(
      () => hydrate(),
      Math.min(Math.max(msUntilExpiry, 0), MAX_TIMEOUT_MS),
    );
  }, [clearExpiryTimer]);

  useEffect(() => {
    hydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith('painel.')) hydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearExpiryTimer();
    };
  }, [hydrate, clearExpiryTimer]);

  const login = useCallback(
    async (params: LoginParams) => {
      const { access_token } = await loginRequest(params);
      authStorage.set(access_token);
      hydrate();
    },
    [hydrate],
  );

  const logout = useCallback(() => {
    clearExpiryTimer();
    authStorage.clear();
    setState({ status: 'unauthenticated', user: null });
    router.replace('/login');
  }, [router, clearExpiryTimer]);

  return createElement(AuthContext.Provider, { value: { ...state, login, logout } }, children);
}

export function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
