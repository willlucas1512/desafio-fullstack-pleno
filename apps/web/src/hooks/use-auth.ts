"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  type LoginParams,
  type SessionUser,
} from "@/lib/api/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
}

export interface UseAuthResult extends AuthState {
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<UseAuthResult | null>(null);

const MAX_TIMEOUT_MS = 2_147_483_647;
const REFRESH_SKEW_MS = 60_000;
const REFRESH_RETRY_MS = 30_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ref pra agendar a renovação sem criar dependência circular entre os callbacks
  const refreshRef = useRef<() => void>(() => {});
  const hydrateRef = useRef<() => void>(() => {});

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  const scheduleAt = useCallback(
    (delayMs: number, fn: () => void) => {
      clearExpiryTimer();
      expiryTimer.current = setTimeout(
        fn,
        Math.min(Math.max(delayMs, 0), MAX_TIMEOUT_MS),
      );
    },
    [clearExpiryTimer],
  );

  const applyUser = useCallback(
    (user: SessionUser | null) => {
      if (!user) {
        clearExpiryTimer();
        setState({ status: "unauthenticated", user: null });
        return;
      }
      setState({ status: "authenticated", user });
      // agenda a renovação um pouco antes da expiração (sliding session)
      scheduleAt(user.exp * 1000 - Date.now() - REFRESH_SKEW_MS, () =>
        refreshRef.current(),
      );
    },
    [clearExpiryTimer, scheduleAt],
  );

  const hydrate = useCallback(async () => {
    try {
      const user = await fetchSession();
      applyUser(user);
    } catch {
      setState((prev) =>
        prev.status === "authenticated"
          ? prev
          : { status: "unauthenticated", user: null },
      );
    }
  }, [applyUser]);

  const refresh = useCallback(async () => {
    try {
      applyUser(await refreshSession());
    } catch {
      // indisponibilidade transitória: mantém a sessão atual e tenta de novo
      scheduleAt(REFRESH_RETRY_MS, () => refreshRef.current());
    }
  }, [applyUser, scheduleAt]);

  useEffect(() => {
    refreshRef.current = () => void refresh();
    hydrateRef.current = () => void hydrate();
    void hydrate();
    // re-checa a sessão ao voltar pra aba (ex.: logout em outra aba, expiração)
    const onFocus = () => void hydrate();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearExpiryTimer();
    };
  }, [hydrate, refresh, clearExpiryTimer]);

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
    router.replace("/login");
  }, [router, applyUser]);

  return createElement(
    AuthContext.Provider,
    { value: { ...state, login, logout } },
    children,
  );
}

export function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}

export function useOptionalAuth(): UseAuthResult | null {
  return useContext(AuthContext);
}
