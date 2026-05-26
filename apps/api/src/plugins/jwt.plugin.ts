import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface JwtPluginOptions {
  secret: string;
  expiresIn: string;
}

async function plugin(app: FastifyInstance, opts: JwtPluginOptions): Promise<void> {
  await app.register(jwt, {
    secret: opts.secret,
    sign: { expiresIn: opts.expiresIn },
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      request.log.warn({ err }, 'JWT verification failed');
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token inválido ou expirado',
      });
    }
  });
}

export const jwtPlugin = fp(plugin, { name: 'jwt-plugin' });
