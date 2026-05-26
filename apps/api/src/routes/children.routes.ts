import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ChildrenService, listChildrenQuerySchema } from '../services/children.service.js';

const childIdParamSchema = z.object({ id: z.string().min(1) });

export interface ChildrenRoutesOptions {
  childrenService: ChildrenService;
}

export function createChildrenRoutes({ childrenService }: ChildrenRoutesOptions): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get('/children', async (request, reply) => {
      const parsed = listChildrenQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Parâmetros de consulta inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      return childrenService.list(parsed.data);
    });

    app.get('/children/neighborhoods', async () => ({
      bairros: childrenService.listNeighborhoods(),
    }));

    app.get('/children/:id', async (request, reply) => {
      const parsed = childIdParamSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'ID inválido',
        });
      }
      const child = childrenService.findById(parsed.data.id);
      if (!child) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Criança ${parsed.data.id} não encontrada`,
        });
      }
      return child;
    });

  };
  return plugin;
}
