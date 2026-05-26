import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { Env } from './config/env.js';
import { jwtPlugin } from './plugins/jwt.plugin.js';
import type { ChildrenRepository } from './repositories/children.repository.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createChildrenRoutes } from './routes/children.routes.js';
import { createAuthService } from './services/auth.service.js';
import { ChildrenService } from './services/children.service.js';

export interface BuildAppOptions {
  env: Env;
  childrenRepo: ChildrenRepository;
}

export async function buildApp({ env, childrenRepo }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'production'
        ? { level: env.LOG_LEVEL }
        : env.NODE_ENV === 'test'
          ? false
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
  const childrenService = new ChildrenService(childrenRepo);

  await app.register(createAuthRoutes({ authService }));
  await app.register(createChildrenRoutes({ childrenService }));

  return app;
}
