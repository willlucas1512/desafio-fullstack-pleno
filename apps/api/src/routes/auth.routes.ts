import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AuthService } from '../services/auth.service.js';

const loginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export interface AuthRoutesOptions {
  authService: AuthService;
}

export function createAuthRoutes({ authService }: AuthRoutesOptions): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.post('/auth/token', async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Credenciais inválidas',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, password } = parsed.data;
      if (!authService.authenticate(email, password)) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'E-mail ou senha incorretos',
        });
      }

      const token = await reply.jwtSign({ preferred_username: email });
      return reply.send({ access_token: token, token_type: 'Bearer' });
    });
  };
  return plugin;
}
