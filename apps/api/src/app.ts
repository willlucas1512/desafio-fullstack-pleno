import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { Env } from './config/env.js';
import { jwtPlugin } from './plugins/jwt.plugin.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createAuthService } from './services/auth.service.js';

export interface BuildAppOptions {
  env: Env;
}

export async function buildApp({ env }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'production'
        ? { level: env.LOG_LEVEL }
        : {
            level: env.LOG_LEVEL,
            transport: {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
            },
          },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });
  await app.register(jwtPlugin, { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const authService = createAuthService({
    email: env.TECHNICIAN_EMAIL,
    password: env.TECHNICIAN_PASSWORD,
  });

  await app.register(createAuthRoutes({ authService }));

  return app;
}
