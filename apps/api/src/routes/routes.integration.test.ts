import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { ChildrenRepository } from '../repositories/children.repository.js';
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
};

describe('HTTP routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const repo = new ChildrenRepository(fixtureChildren);
    app = await buildApp({ env: testEnv, childrenRepo: repo });
  });

  afterAll(async () => {
    await app.close();
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

    it('rejects malformed payload with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/token',
        payload: { email: 'not-an-email' },
      });
      expect(res.statusCode).toBe(400);
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

  describe('GET /children', () => {
    it('returns paginated list', async () => {
      const res = await app.inject({ method: 'GET', url: '/children?pageSize=2&page=1' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.items).toHaveLength(2);
      expect(body.pagination.total).toBe(5);
    });

    it('filters by alerts area', async () => {
      const res = await app.inject({ method: 'GET', url: '/children?alertas=saude' });
      const body = res.json();
      expect(body.items.map((c: { id: string }) => c.id)).toEqual(['c002']);
    });

    it('returns 400 for invalid query', async () => {
      const res = await app.inject({ method: 'GET', url: '/children?alertas=invalida' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /children/:id', () => {
    it('returns the child', async () => {
      const res = await app.inject({ method: 'GET', url: '/children/c001' });
      expect(res.statusCode).toBe(200);
      expect(res.json().nome).toBe('Ana Clara Mendes');
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({ method: 'GET', url: '/children/nope' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /summary', () => {
    it('returns aggregated counts', async () => {
      const res = await app.inject({ method: 'GET', url: '/summary' });
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

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/children/nope/review',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
