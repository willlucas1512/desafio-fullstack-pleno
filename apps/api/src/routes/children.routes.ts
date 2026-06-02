import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { errorResponseSchema } from '../domain/http.js';
import { listChildrenQuerySchema, type ListChildrenQuery } from '../domain/child-query.js';
import {
  childResponseSchema,
  listChildrenResultSchema,
  type ChildResponse,
} from '../domain/child-status.js';
import { reviewHistorySchema } from '../domain/review-audit.js';
import type { ChildrenService } from '../services/children.service.js';

const childIdParamSchema = z.object({ id: z.string().min(1) });
type ChildIdParam = z.infer<typeof childIdParamSchema>;

const neighborhoodsResponseSchema = z.object({ bairros: z.array(z.string()) });

const protectedRoute = (extra: Record<string, unknown> = {}) => ({
  security: [{ bearerAuth: [] }],
  tags: ['children'],
  ...extra,
});

export interface ChildrenRoutesOptions {
  childrenService: ChildrenService;
}

function notFound(reply: FastifyReply, id: string): FastifyReply {
  return reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `Criança ${id} não encontrada`,
  });
}

export function createChildrenRoutes({ childrenService }: ChildrenRoutesOptions): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get<{ Querystring: ListChildrenQuery }>(
      '/children',
      {
        preHandler: [app.authenticate],
        schema: protectedRoute({
          summary: 'Lista crianças com filtros, ordenação e paginação',
          querystring: listChildrenQuerySchema,
          response: { 200: listChildrenResultSchema, 400: errorResponseSchema, 401: errorResponseSchema },
        }),
      },
      (request) => childrenService.list(request.query),
    );

    app.get(
      '/children/neighborhoods',
      {
        preHandler: [app.authenticate],
        schema: protectedRoute({
          summary: 'Lista os bairros distintos',
          response: { 200: neighborhoodsResponseSchema, 401: errorResponseSchema },
        }),
      },
      async () => ({ bairros: await childrenService.listNeighborhoods() }),
    );

    app.get<{ Params: ChildIdParam }>(
      '/children/:id',
      {
        preHandler: [app.authenticate],
        schema: protectedRoute({
          summary: 'Detalhe completo de uma criança',
          params: childIdParamSchema,
          response: { 200: childResponseSchema, 401: errorResponseSchema, 404: errorResponseSchema },
        }),
      },
      async (request, reply) => {
        const child = await childrenService.findById(request.params.id);
        return child ?? notFound(reply, request.params.id);
      },
    );

    app.patch<{ Params: ChildIdParam }>(
      '/children/:id/review',
      {
        preHandler: [app.authenticate],
        schema: protectedRoute({
          summary: 'Registra que o técnico autenticado revisou o caso',
          params: childIdParamSchema,
          response: { 200: childResponseSchema, 401: errorResponseSchema, 404: errorResponseSchema },
        }),
      },
      async (request, reply) => {
        const reviewer = request.user.preferred_username;
        const updated: ChildResponse | null = await childrenService.markReviewed(request.params.id, reviewer);
        if (!updated) return notFound(reply, request.params.id);
        request.log.info({ childId: updated.id, reviewer }, 'caso revisado');
        return updated;
      },
    );

    app.delete<{ Params: ChildIdParam }>(
      '/children/:id/review',
      {
        preHandler: [app.authenticate],
        schema: protectedRoute({
          summary: 'Desfaz a revisão de um caso',
          params: childIdParamSchema,
          response: { 200: childResponseSchema, 401: errorResponseSchema, 404: errorResponseSchema },
        }),
      },
      async (request, reply) => {
        const updated: ChildResponse | null = await childrenService.unmarkReviewed(request.params.id);
        if (!updated) return notFound(reply, request.params.id);
        request.log.info(
          { childId: updated.id, reviewer: request.user.preferred_username },
          'revisão desfeita',
        );
        return updated;
      },
    );

    app.get<{ Params: ChildIdParam }>(
      '/children/:id/review-history',
      {
        preHandler: [app.authenticate],
        schema: protectedRoute({
          summary: 'Trilha de auditoria das revisões do caso (mais recente primeiro)',
          params: childIdParamSchema,
          response: { 200: reviewHistorySchema, 401: errorResponseSchema, 404: errorResponseSchema },
        }),
      },
      async (request, reply) => {
        const items = await childrenService.reviewHistory(request.params.id);
        return items ? { items } : notFound(reply, request.params.id);
      },
    );
  };
  return plugin;
}
