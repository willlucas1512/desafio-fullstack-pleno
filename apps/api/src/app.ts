import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { ZodError } from 'zod';
import type { Env } from './config/env.js';
import { jwtPlugin } from './plugins/jwt.plugin.js';
import {
  jsonSchemaTransform,
  zodSerializerCompiler,
  zodValidatorCompiler,
} from './plugins/zod-openapi.js';
import type { ChildrenStore } from './repositories/children-store.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createChildrenRoutes } from './routes/children.routes.js';
import { createSummaryRoutes } from './routes/summary.routes.js';
import { createAuthService, type AuthService } from './services/auth.service.js';
import { ChildrenService } from './services/children.service.js';
import { SummaryService } from './services/summary.service.js';

export interface BuildAppOptions {
  env: Env;
  childrenRepo: ChildrenStore;
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

  app.setValidatorCompiler(zodValidatorCompiler);
  app.setSerializerCompiler(zodSerializerCompiler);
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const zodError = toZodError(error);
    if (zodError) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Requisição inválida',
        details: zodError.flatten().fieldErrors,
      });
    }

    const status = error.statusCode ?? 500;
    if (status >= 500) request.log.error(error);
    return reply.code(status).send({
      statusCode: status,
      error: error.name || 'Internal Server Error',
      message: status >= 500 ? 'Erro interno' : error.message,
    });
  });

  await app.register(sensible);
  await app.register(helmet, {
    // CSP restritiva mantida: só afrouxamos o necessário pra UI do Swagger, que
    // injeta estilos/scripts inline em /docs. O resto fica no default seguro
    // (default-src 'self', object-src 'none', frame-ancestors, etc.).
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  });
  // desligado nos testes pra não esbarrar no limite com as requisições da suíte
  if (env.NODE_ENV !== 'test') {
    await app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });
  }
  await app.register(jwtPlugin, { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });

  const authService = createAuthService({
    email: env.TECHNICIAN_EMAIL,
    password: env.TECHNICIAN_PASSWORD,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Painel de Acompanhamento — API',
        description:
          'API do painel de crianças acompanhadas (saúde, educação, assistência social).',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  // /docs fica atrás de HTTP Basic Auth (mesmas credenciais do técnico). Basic
  // funciona em navegação direta no browser, onde um Bearer JWT não chegaria.
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiHooks: { onRequest: makeDocsBasicAuth(authService) },
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const childrenService = new ChildrenService(childrenRepo);
  const summaryService = new SummaryService(childrenRepo);

  await app.register(createAuthRoutes({ authService }));
  await app.register(createChildrenRoutes({ childrenService }));
  await app.register(createSummaryRoutes({ summaryService }));

  return app;
}

/** O validador devolve o ZodError direto; o Fastify pode envolvê-lo em `cause`. */
function toZodError(error: unknown): ZodError | null {
  if (error instanceof ZodError) return error;
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof ZodError) return cause;
  return null;
}

/** Hook de HTTP Basic Auth para proteger a UI do Swagger reusando o authService. */
function makeDocsBasicAuth(authService: AuthService) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers.authorization;
    if (header?.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf-8');
      const sep = decoded.indexOf(':');
      if (sep !== -1) {
        const user = decoded.slice(0, sep);
        const pass = decoded.slice(sep + 1);
        if (authService.authenticate(user, pass)) return;
      }
    }
    await reply
      .header('WWW-Authenticate', 'Basic realm="API docs", charset="UTF-8"')
      .code(401)
      .send({ statusCode: 401, error: 'Unauthorized', message: 'Autenticação necessária' });
  };
}
