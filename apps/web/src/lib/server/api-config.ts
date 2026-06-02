import { NextResponse } from "next/server";

/**
 * Configuração server-side do BFF.
 */
export const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

/** Nome do cookie httpOnly que guarda o JWT. */
export const SESSION_COOKIE = "painel_session";

interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  expires?: Date;
}

/** Opções do cookie de sessão. Expira junto com o JWT (claim `exp`, em segundos). */
export function sessionCookieOptions(
  expSeconds?: number,
): SessionCookieOptions {
  const base: SessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  return expSeconds ? { ...base, expires: new Date(expSeconds * 1000) } : base;
}

// Pouco abaixo do timeout do axios no cliente (10s).
export const UPSTREAM_TIMEOUT_MS = 9_000;

export async function fetchUpstream(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Resposta de erro padronizada quando a API externa não pôde ser alcançada. */
export function upstreamUnreachable(error: unknown): NextResponse {
  const isTimeout = error instanceof Error && error.name === "AbortError";
  return NextResponse.json(
    isTimeout
      ? {
          statusCode: 504,
          error: "Gateway Timeout",
          message: "A API demorou para responder. Tente novamente.",
        }
      : {
          statusCode: 502,
          error: "Bad Gateway",
          message: "Não foi possível conectar à API. Tente novamente.",
        },
    { status: isTimeout ? 504 : 502 },
  );
}
