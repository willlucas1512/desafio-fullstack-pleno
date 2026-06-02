import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

/** O validador devolve o ZodError direto; o Fastify pode envolvê-lo em `cause`. */
function toZodError(error: unknown): ZodError | null {
  if (error instanceof ZodError) return error;
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof ZodError) return cause;
  return null;
}

/**
 * Error handler central da aplicação. Erros de validação (Zod) viram 400 com os
 * `fieldErrors`; os demais usam o `statusCode` do próprio erro (default 500),
 * logando e escondendo a mensagem quando for 5xx.
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
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
}
