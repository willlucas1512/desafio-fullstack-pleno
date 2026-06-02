import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/server/api-config';

/** Logout: apaga o cookie de sessão. */
export async function POST(): Promise<NextResponse> {
  (await cookies()).delete(SESSION_COOKIE);
  return new NextResponse(null, { status: 204 });
}
