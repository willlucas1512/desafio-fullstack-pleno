import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { jsonSchemaTransform, zodSerializerCompiler, zodValidatorCompiler } from './zod-openapi.js';

const schema = z.object({ id: z.string(), age: z.coerce.number().int() });

describe('zodValidatorCompiler', () => {
  const validate = zodValidatorCompiler({
    schema,
    method: 'GET',
    url: '/x',
    httpPart: 'querystring',
  });

  it('returns the parsed (coerced) value on success', () => {
    const result = validate({ id: 'a', age: '42' });
    expect(result).toEqual({ value: { id: 'a', age: 42 } });
  });

  it('returns a ZodError on failure', () => {
    const result = validate({ id: 'a' });
    expect(result.error).toBeInstanceOf(z.ZodError);
  });
});

describe('zodSerializerCompiler', () => {
  const serialize = zodSerializerCompiler({
    schema,
    method: 'GET',
    url: '/x',
    httpStatus: '200',
  });

  it('serializes data that matches the schema, stripping extra keys', () => {
    const out = serialize({ id: 'a', age: 1, extra: 'drop-me' });
    expect(JSON.parse(out)).toEqual({ id: 'a', age: 1 });
  });

  it('falls back to raw data when the payload does not match (resilient)', () => {
    const payload = { unexpected: true };
    const out = serialize(payload);
    expect(JSON.parse(out)).toEqual(payload);
  });
});

describe('jsonSchemaTransform', () => {
  it('converts Zod schemas in route definitions to JSON Schema', () => {
    const { schema: out } = jsonSchemaTransform({
      url: '/x',
      schema: {
        querystring: z.object({ nome: z.string() }),
        response: { 200: z.object({ ok: z.boolean() }) },
      } as never,
    });

    const querystring = out.querystring as { type: string; properties: Record<string, unknown> };
    expect(querystring.type).toBe('object');
    expect(querystring.properties).toHaveProperty('nome');

    const response = out.response as Record<string, { properties: Record<string, unknown> }>;
    expect(response['200'].properties).toHaveProperty('ok');
  });

  it('returns an empty schema when none is provided', () => {
    expect(jsonSchemaTransform({ url: '/x', schema: undefined })).toEqual({ schema: {}, url: '/x' });
  });
});
