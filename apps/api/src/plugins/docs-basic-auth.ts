import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "../services/auth.service.js";

/**
 * Hook de HTTP Basic Auth para proteger a UI do Swagger (`/docs`) reusando o
 * `authService`.
 */
export function makeDocsBasicAuth(authService: AuthService) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const header = request.headers.authorization;
    if (header?.startsWith("Basic ")) {
      const decoded = Buffer.from(
        header.slice("Basic ".length),
        "base64",
      ).toString("utf-8");
      const sep = decoded.indexOf(":");
      if (sep !== -1) {
        const user = decoded.slice(0, sep);
        const pass = decoded.slice(sep + 1);
        if (authService.authenticate(user, pass)) return;
      }
    }
    await reply
      .header("WWW-Authenticate", 'Basic realm="API docs", charset="UTF-8"')
      .code(401)
      .send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Autenticação necessária",
      });
  };
}
