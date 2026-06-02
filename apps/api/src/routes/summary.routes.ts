import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { summarySchema } from '../domain/summary.js';
import { errorResponseSchema } from '../domain/http.js';
import type { ChildrenService } from '../services/children.service.js';

export interface SummaryRoutesOptions {
  childrenService: ChildrenService;
}

export function createSummaryRoutes({ childrenService }: SummaryRoutesOptions): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get(
      '/summary',
      {
        preHandler: [app.authenticate],
        schema: {
          tags: ['summary'],
          summary: 'Indicadores agregados do painel',
          security: [{ bearerAuth: [] }],
          response: { 200: summarySchema, 401: errorResponseSchema },
        },
      },
      () => childrenService.summary(),
    );
  };
  return plugin;
}
