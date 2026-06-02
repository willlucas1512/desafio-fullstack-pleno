import { type NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/server/api-config";

const PROTECTED_PREFIXES = ["/dashboard", "/children"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const authenticated =
    readSession(request.cookies.get(SESSION_COOKIE)?.value) !== null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/children/:path*", "/login"],
};
