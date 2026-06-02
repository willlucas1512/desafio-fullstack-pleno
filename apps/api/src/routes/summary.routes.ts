import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { errorResponseSchema } from '../domain/http.js';
import { type SummaryService, summarySchema } from '../services/summary.service.js';

export interface SummaryRoutesOptions {
  summaryService: SummaryService;
}

export function createSummaryRoutes({ summaryService }: SummaryRoutesOptions): FastifyPluginAsync {
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
      () => summaryService.build(),
    );
  };
  return plugin;
}
