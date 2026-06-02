import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '..', '..');

const PORT = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 3000);
const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 3001);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_EMAIL = 'a@e2e.test';
const TEST_PASS = 'x';
// A API sobe em dev (npx) e fala com o Postgres do compose publicado no host:
// `docker compose up -d postgres`. Migrations + seed rodam no boot da API.
const DB_PORT = Number(process.env.DB_HOST_PORT ?? 5432);
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  `postgres://painel:painel@127.0.0.1:${DB_PORT}/painel`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Folga p/ o primeiro acesso a cada rota, que o Next em dev compila sob demanda.
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // Serial: o Next em dev compila cada rota sob demanda. Com vários workers, os
  // primeiros acessos concorrentes à mesma rota ainda-não-compilada estouram o
  // timeout. Um worker compila cada rota uma vez e as seguintes reaproveitam.
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: `npm run dev --workspace=apps/api`,
      cwd: repoRoot,
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        HOST: '127.0.0.1',
        JWT_SECRET: 'placeholder value used only by the Playwright suite',
        JWT_EXPIRES_IN: '5m',
        TECHNICIAN_EMAIL: TEST_EMAIL,
        TECHNICIAN_PASSWORD: TEST_PASS,
        CORS_ORIGIN: BASE_URL,
        DATABASE_URL,
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: `npx next dev -p ${PORT}`,
      cwd: path.resolve(repoRoot, 'apps', 'web'),
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        API_URL: `http://127.0.0.1:${API_PORT}`,
        E2E_TEST_EMAIL: TEST_EMAIL,
        E2E_TEST_PASS: TEST_PASS,
      },
    },
  ],
});
