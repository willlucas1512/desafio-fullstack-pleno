import type { FastifySchema, FastifySchemaCompiler, FastifySerializerCompiler } from 'fastify';
import { ZodType, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Faz o Fastify validar usando Zod (fonte única de verdade): o schema de cada
 * rota é um objeto Zod, e o valor já transformado (coerções, defaults) substitui
 * `request.query`/`params`/`body`. Em caso de erro, devolve o `ZodError` pro
 * error handler montar a resposta 400 padronizada.
 */
export const zodValidatorCompiler: FastifySchemaCompiler<ZodTypeAny> =
  ({ schema }) =>
  (data) => {
    const result = schema.safeParse(data);
    return result.success ? { value: result.data } : { error: result.error };
  };

/**
 * Serializa as respostas usando o schema Zod da rota: campos extras são
 * removidos (o payload bate com o que o OpenAPI documenta). É resiliente — se a
 * resposta não casar com o schema, devolve o dado cru em vez de quebrar a
 * requisição, deixando o desvio aparecer sem derrubar o endpoint.
 */
export const zodSerializerCompiler: FastifySerializerCompiler<ZodTypeAny> =
  ({ schema }) =>
  (data) => {
    const result = schema.safeParse(data);
    return JSON.stringify(result.success ? result.data : data);
  };

function toJsonSchema(schema: unknown): unknown {
  if (schema instanceof ZodType) {
    return zodToJsonSchema(schema, { target: 'openApi3', $refStrategy: 'none' });
  }
  return schema;
}

interface TransformArgs {
  schema?: FastifySchema;
  url: string;
}

/**
 * Converte os schemas Zod das rotas em JSON Schema na hora de gerar o OpenAPI,
 * pro `@fastify/swagger` documentar as mesmas regras que validam em runtime.
 */
export function jsonSchemaTransform({
  schema,
  url,
}: TransformArgs): { schema: FastifySchema; url: string } {
  if (!schema) return { schema: {}, url };

  const { querystring, params, body, headers, response, ...rest } = schema as Record<
    string,
    unknown
  >;
  const transformed: Record<string, unknown> = { ...rest };

  if (querystring) transformed.querystring = toJsonSchema(querystring);
  if (params) transformed.params = toJsonSchema(params);
  if (body) transformed.body = toJsonSchema(body);
  if (headers) transformed.headers = toJsonSchema(headers);
  if (response && typeof response === 'object') {
    transformed.response = Object.fromEntries(
      Object.entries(response as Record<string, unknown>).map(([code, s]) => [code, toJsonSchema(s)]),
    );
  }

  return { schema: transformed as FastifySchema, url };
}
