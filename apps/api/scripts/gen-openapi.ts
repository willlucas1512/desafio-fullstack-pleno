import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';
import type { Env } from '../src/config/env.js';
import { FakeChildrenStore } from '../src/test/fake-children-store.js';

/**
 * Gera o documento OpenAPI a partir dos schemas Zod das rotas (fonte única de
 * verdade) e o grava em `apps/api/openapi.json`. O front consome esse arquivo
 * via `openapi-typescript` pra derivar seus tipos — sem duplicação manual.
 *
 * Sobe o app só pra extrair o doc (`app.swagger()`), com um store in-memory
 * vazio e um env mínimo: nada toca o Postgres nem a rede.
 */
const env: Env = {
  NODE_ENV: 'test',
  PORT: 3001,
  HOST: '127.0.0.1',
  LOG_LEVEL: 'error',
  JWT_SECRET: 'openapi-codegen-placeholder-secret',
  JWT_EXPIRES_IN: '1h',
  TECHNICIAN_EMAIL: 'openapi@codegen.local',
  TECHNICIAN_PASSWORD: 'codegen',
  CORS_ORIGIN: 'http://localhost:3000',
  SEED_FILE: '../../data/seed.json',
  DATABASE_URL: 'postgres://codegen@localhost:5432/codegen',
};

async function main(): Promise<void> {
  const app = await buildApp({ env, childrenRepo: new FakeChildrenStore([]) });
  await app.ready();
  const doc = app.swagger();
  await app.close();

  const out = fileURLToPath(new URL('../openapi.json', import.meta.url));
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`OpenAPI escrito em ${out}`);
}

void main();
