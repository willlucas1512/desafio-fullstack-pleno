import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { FakeChildrenStore } from '../test/fake-children-store.js';
import { fixtureChildren } from '../test/fixtures.js';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../config/env.js';
const testEnv: Env = {
  NODE_ENV: 'test',
  PORT: 0,
  HOST: '127.0.0.1',
  LOG_LEVEL: 'fatal',
  JWT_SECRET: 'placeholder value used only by the integration suite',
  JWT_EXPIRES_IN: '5m',
  TECHNICIAN_EMAIL: 'a@b.test',
  TECHNICIAN_PASSWORD: 'x',
  CORS_ORIGIN: 'http://localhost:3000',
  SEED_FILE: '',
  // valor só satisfaz o tipo Env; a suíte usa FakeChildrenStore e nunca conecta
  DATABASE_URL: 'postgres://test:test@localhost:5432/test_db',
};

describe('HTTP routes', () => {
  let app: FastifyInstance;
  let authHeaders: { authorization: string };

  beforeAll(async () => {
    const repo = new FakeChildrenStore(fixtureChildren);
    app = await buildApp({ env: testEnv, childrenRepo: repo });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/token',
      payload: { email: testEnv.TECHNICIAN_EMAIL, password: testEnv.TECHNICIAN_PASSWORD },
    });
    authHeaders = { authorization: `Bearer ${res.json().access_token}` };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /docs (Swagger UI)', () => {
    it('returns 401 without Basic Auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/docs/' });
      expect(res.statusCode).toBe(401);
      expect(res.headers['www-authenticate']).toContain('Basic');
    });

    it('serves the docs with valid Basic Auth', async () => {
      const creds = Buffer.from(
        `${testEnv.TECHNICIAN_EMAIL}:${testEnv.TECHNICIAN_PASSWORD}`,
      ).toString('base64');
      const res = await app.inject({
        method: 'GET',
        url: '/docs/',
        headers: { authorization: `Basic ${creds}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('documents request and response schemas in the OpenAPI spec', async () => {
      const creds = Buffer.from(
        `${testEnv.TECHNICIAN_EMAIL}:${testEnv.TECHNICIAN_PASSWORD}`,
      ).toString('base64');
      const res = await app.inject({
        method: 'GET',
        url: '/docs/json',
        headers: { authorization: `Basic ${creds}` },
      });
      expect(res.statusCode).toBe(200);
      const spec = res.json();

      // todos os endpoints do enunciado documentados
      expect(Object.keys(spec.paths).sort()).toEqual(
        expect.arrayContaining(['/auth/token', '/children', '/children/{id}', '/summary']),
      );

      // schema de resposta 200 presente (não só os parâmetros de entrada)
      const listOk = spec.paths['/children'].get.responses['200'];
      expect(listOk.content['application/json'].schema.properties).toHaveProperty('pagination');

      const summaryOk = spec.paths['/summary'].get.responses['200'];
      expect(summaryOk.content['application/json'].schema.properties).toHaveProperty('total_criancas');

      // erro padronizado documentado
      expect(spec.paths['/children'].get.responses).toHaveProperty('401');
    });
  });

  describe('POST /auth/token', () => {
    it('returns a JWT on valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: testEnv.TECHNICIAN_EMAIL, password: testEnv.TECHNICIAN_PASSWORD },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty('access_token');
      expect(body.token_type).toBe('Bearer');
    });

    it('rejects bad password with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: testEnv.TECHNICIAN_EMAIL, password: 'wrong' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects malformed payload with 400 and the standardized error shape', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: 'not-an-email' },
      });
      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
      expect(body.details).toHaveProperty('email');
      expect(body.details).toHaveProperty('password');
    });

    it('issues a token with preferred_username matching the email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: testEnv.TECHNICIAN_EMAIL, password: testEnv.TECHNICIAN_PASSWORD },
      });
      const { access_token } = res.json();
      const [, payloadB64] = access_token.split('.') as [string, string];
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      expect(payload.preferred_username).toBe(testEnv.TECHNICIAN_EMAIL);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/refresh' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for a malformed/invalid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { authorization: 'Bearer not.a.jwt' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('reissues a JWT for the same technician on a valid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token_type).toBe('Bearer');
      expect(body).toHaveProperty('access_token');

      const [, payloadB64] = (body.access_token as string).split('.') as [string, string];
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      expect(payload.preferred_username).toBe(testEnv.TECHNICIAN_EMAIL);
    });
  });

  describe('GET /children', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/children' });
      expect(res.statusCode).toBe(401);
    });

    it('returns paginated list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/children?pageSize=2&page=1',
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.items).toHaveLength(2);
      expect(body.pagination.total).toBe(5);
    });

    it('filters by alerts area', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/children?alertas=saude',
        headers: authHeaders,
      });
      const body = res.json();
      expect(body.items.map((c: { id: string }) => c.id)).toEqual(['c002']);
    });

    it('returns 400 for invalid query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/children?alertas=invalida',
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /children/:id', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/children/c001' });
      expect(res.statusCode).toBe(401);
    });

    it('returns the child', async () => {
      const res = await app.inject({ method: 'GET', url: '/children/c001', headers: authHeaders });
      expect(res.statusCode).toBe(200);
      expect(res.json().nome).toBe('Ana Clara Mendes');
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({ method: 'GET', url: '/children/nope', headers: authHeaders });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /summary', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/summary' });
      expect(res.statusCode).toBe(401);
    });

    it('returns aggregated counts', async () => {
      const res = await app.inject({ method: 'GET', url: '/summary', headers: authHeaders });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.total_criancas).toBe(5);
      expect(body.alertas_por_area).toMatchObject({
        saude: expect.any(Number),
        educacao: expect.any(Number),
        assistencia_social: expect.any(Number),
      });
    });
  });

  describe('PATCH /children/:id/review', () => {
    let token: string;
    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: testEnv.TECHNICIAN_EMAIL, password: testEnv.TECHNICIAN_PASSWORD },
      });
      token = res.json().access_token;
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/children/c001/review' });
      expect(res.statusCode).toBe(401);
    });

    it('marks the child as reviewed with the authenticated email', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/children/c002/review',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.revisado).toBe(true);
      expect(body.revisado_por).toBe(testEnv.TECHNICIAN_EMAIL);
      expect(body.revisado_em).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('is idempotent: re-marking keeps the original revisado_em', async () => {
      const first = await app.inject({
        method: 'PATCH',
        url: '/children/c005/review',
        headers: { authorization: `Bearer ${token}` },
      });
      const firstAt = first.json().revisado_em;

      const second = await app.inject({
        method: 'PATCH',
        url: '/children/c005/review',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(second.statusCode).toBe(200);
      expect(second.json().revisado_em).toBe(firstAt);
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/children/nope/review',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /children/:id/review-history', () => {
    let token: string;
    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: testEnv.TECHNICIAN_EMAIL, password: testEnv.TECHNICIAN_PASSWORD },
      });
      token = res.json().access_token;
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/children/c001/review-history' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/children/nope/review-history',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('records an append-only trail of review transitions (newest first)', async () => {
      const auth = { authorization: `Bearer ${token}` };
      await app.inject({ method: 'PATCH', url: '/children/c001/review', headers: auth });
      await app.inject({ method: 'DELETE', url: '/children/c001/review', headers: auth });

      const res = await app.inject({
        method: 'GET',
        url: '/children/c001/review-history',
        headers: auth,
      });
      expect(res.statusCode).toBe(200);
      const { items } = res.json();
      expect(items).toHaveLength(2);
      expect(items[0].action).toBe('revisao_desfeita');
      expect(items[1].action).toBe('revisado');
      expect(items[1].reviewer).toBe(testEnv.TECHNICIAN_EMAIL);
    });
  });

  describe('DELETE /children/:id/review', () => {
    let token: string;
    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: testEnv.TECHNICIAN_EMAIL, password: testEnv.TECHNICIAN_PASSWORD },
      });
      token = res.json().access_token;
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/children/c001/review' });
      expect(res.statusCode).toBe(401);
    });

    it('reverts a review (revisado back to false, fields cleared)', async () => {
      await app.inject({
        method: 'PATCH',
        url: '/children/c004/review',
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: '/children/c004/review',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.revisado).toBe(false);
      expect(body.revisado_por).toBeNull();
      expect(body.revisado_em).toBeNull();
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/children/nope/review',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
