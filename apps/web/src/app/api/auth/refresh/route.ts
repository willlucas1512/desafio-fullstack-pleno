import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJwt, toSessionUser } from "@/lib/auth/jwt";
import {
  API_URL,
  SESSION_COOKIE,
  fetchUpstream,
  sessionCookieOptions,
  upstreamUnreachable,
} from "@/lib/server/api-config";

export async function POST(): Promise<NextResponse> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetchUpstream(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return upstreamUnreachable(error);
  }

  const data = (await upstream.json().catch(() => null)) as {
    access_token?: string;
  } | null;

  if (!upstream.ok || !data?.access_token) {
    if (upstream.status === 401) jar.delete(SESSION_COOKIE);
    return NextResponse.json(
      { user: null },
      { status: upstream.status === 200 ? 502 : upstream.status },
    );
  }

  const payload = decodeJwt(data.access_token);
  jar.set(
    SESSION_COOKIE,
    data.access_token,
    sessionCookieOptions(payload?.exp),
  );
  return NextResponse.json({ user: payload ? toSessionUser(payload) : null });
}
