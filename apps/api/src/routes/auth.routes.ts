import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { errorResponseSchema } from "../domain/http.js";
import type { AuthService } from "../services/auth.service.js";

const loginBodySchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("Bearer"),
});

export interface AuthRoutesOptions {
  authService: AuthService;
}

type LoginBody = z.infer<typeof loginBodySchema>;

export function createAuthRoutes({
  authService,
}: AuthRoutesOptions): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post<{ Body: LoginBody }>(
      "/auth/token",
      {
        // limite mais agressivo que o global: trava brute-force/credential stuffing
        config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
        schema: {
          tags: ["auth"],
          summary: "Autentica o técnico e retorna um JWT",
          body: loginBodySchema,
          response: {
            200: tokenResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
          },
        },
      },
      async (request, reply) => {
        const { email, password } = request.body;
        if (!authService.authenticate(email, password)) {
          return reply.code(401).send({
            statusCode: 401,
            error: "Unauthorized",
            message: "E-mail ou senha incorretos",
          });
        }

        const token = await reply.jwtSign({ preferred_username: email });
        return reply.send({ access_token: token, token_type: "Bearer" });
      },
    );

    // Sliding session: troca um JWT ainda válido por um novo com `exp` renovado.
    app.post(
      "/auth/refresh",
      {
        preHandler: [app.authenticate],
        schema: {
          tags: ["auth"],
          summary: "Renova o JWT do técnico autenticado (sliding session)",
          security: [{ bearerAuth: [] }],
          response: { 200: tokenResponseSchema, 401: errorResponseSchema },
        },
      },
      async (request, reply) => {
        const token = await reply.jwtSign({
          preferred_username: request.user.preferred_username,
        });
        return reply.send({ access_token: token, token_type: "Bearer" });
      },
    );
  };
  return plugin;
}
