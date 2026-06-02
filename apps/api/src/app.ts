import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { Env } from "./config/env.js";
import { makeDocsBasicAuth } from "./plugins/docs-basic-auth.js";
import { errorHandler } from "./plugins/error-handler.js";
import { jwtPlugin } from "./plugins/jwt.plugin.js";
import {
  jsonSchemaTransform,
  zodSerializerCompiler,
  zodValidatorCompiler,
} from "./plugins/zod-openapi.js";
import type { ChildrenStore } from "./repositories/children-store.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createChildrenRoutes } from "./routes/children.routes.js";
import { createSummaryRoutes } from "./routes/summary.routes.js";
import { createAuthService } from "./services/auth.service.js";
import { ChildrenService } from "./services/children.service.js";

export interface BuildAppOptions {
  env: Env;
  childrenRepo: ChildrenStore;
}

export async function buildApp({
  env,
  childrenRepo,
}: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === "production"
        ? { level: env.LOG_LEVEL }
        : env.NODE_ENV === "test"
          ? false
          : {
              level: env.LOG_LEVEL,
              transport: {
                target: "pino-pretty",
                options: {
                  translateTime: "HH:MM:ss Z",
                  ignore: "pid,hostname",
                },
              },
            },
    disableRequestLogging: env.NODE_ENV === "test",
  });

  app.setValidatorCompiler(zodValidatorCompiler);
  app.setSerializerCompiler(zodSerializerCompiler);
  app.setErrorHandler(errorHandler);

  await app.register(sensible);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  });
  // desligado nos testes pra não esbarrar no limite com as requisições da suíte
  if (env.NODE_ENV !== "test") {
    await app.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });
  }
  await app.register(jwtPlugin, {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const authService = createAuthService({
    email: env.TECHNICIAN_EMAIL,
    password: env.TECHNICIAN_PASSWORD,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Painel de Acompanhamento — API",
        description:
          "API do painel de crianças acompanhadas (saúde, educação, assistência social).",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  // /docs fica atrás de HTTP Basic Auth (mesmas credenciais do técnico).
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiHooks: { onRequest: makeDocsBasicAuth(authService) },
  });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  const childrenService = new ChildrenService(childrenRepo);

  await app.register(createAuthRoutes({ authService }));
  await app.register(createChildrenRoutes({ childrenService }));
  await app.register(createSummaryRoutes({ childrenService }));

  return app;
}
