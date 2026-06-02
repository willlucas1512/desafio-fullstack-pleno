import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  API_URL,
  SESSION_COOKIE,
  fetchUpstream,
  upstreamUnreachable,
} from "@/lib/server/api-config";

const ALLOWED_PREFIXES = ["children", "summary"];

function isAllowed(path: string[]): boolean {
  const head = path[0];
  return head !== undefined && ALLOWED_PREFIXES.includes(head);
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;

  if (!isAllowed(path)) {
    return NextResponse.json(
      { statusCode: 404, error: "Not Found", message: "Rota não encontrada" },
      { status: 404 },
    );
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, error: "Unauthorized", message: "Sessão necessária" },
      { status: 401 },
    );
  }

  const target = `${API_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const init: RequestInit = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const reqBody = await request.text();
    if (reqBody) {
      init.body = reqBody;
      (init.headers as Record<string, string>)["Content-Type"] =
        request.headers.get("content-type") ?? "application/json";
    }
  }

  let upstream: Response;
  try {
    upstream = await fetchUpstream(target, init);
  } catch (error) {
    return upstreamUnreachable(error);
  }
  const responseBody = await upstream.text();
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });

  if (upstream.status === 401) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
  handler as PUT,
};
