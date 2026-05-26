import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { SummaryService } from '../services/summary.service.js';

export interface SummaryRoutesOptions {
  summaryService: SummaryService;
}

export function createSummaryRoutes({ summaryService }: SummaryRoutesOptions): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get('/summary', async () => summaryService.build());
  };
  return plugin;
}
