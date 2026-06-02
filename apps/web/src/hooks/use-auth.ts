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
import {
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
  type LoginParams,
  type SessionUser,
} from '@/lib/api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
}

export interface UseAuthResult extends AuthState {
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<UseAuthResult | null>(null);

// setTimeout usa int de 32 bits; limita o atraso para evitar overflow (dispara antes e re-hidrata).
const MAX_TIMEOUT_MS = 2_147_483_647;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ref pra agendar a re-hidratação sem criar dependência circular entre os callbacks
  const hydrateRef = useRef<() => void>(() => {});

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  const applyUser = useCallback(
    (user: SessionUser | null) => {
      clearExpiryTimer();
      if (!user) {
        setState({ status: 'unauthenticated', user: null });
        return;
      }
      setState({ status: 'authenticated', user });
      // agenda a transição para "unauthenticated" no exato momento da expiração
      const msUntilExpiry = user.exp * 1000 - Date.now();
      expiryTimer.current = setTimeout(
        () => hydrateRef.current(),
        Math.min(Math.max(msUntilExpiry, 0), MAX_TIMEOUT_MS),
      );
    },
    [clearExpiryTimer],
  );

  const hydrate = useCallback(async () => {
    const user = await fetchSession();
    applyUser(user);
  }, [applyUser]);

  useEffect(() => {
    hydrateRef.current = () => void hydrate();
    void hydrate();
    // re-checa a sessão ao voltar pra aba (ex.: logout em outra aba, expiração)
    const onFocus = () => void hydrate();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearExpiryTimer();
    };
  }, [hydrate, clearExpiryTimer]);

  const login = useCallback(
    async (params: LoginParams) => {
      const user = await loginRequest(params);
      applyUser(user);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    applyUser(null);
    router.replace('/login');
  }, [router, applyUser]);

  return createElement(AuthContext.Provider, { value: { ...state, login, logout } }, children);
}

export function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
