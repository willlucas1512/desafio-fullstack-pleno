import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '..', '..');

const PORT = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 3000);
const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 3001);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_EMAIL = 'a@e2e.test';
const TEST_PASS = 'x';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
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
        PORT: String(API_PORT),
        HOST: '127.0.0.1',
        JWT_SECRET: 'placeholder value used only by the Playwright suite',
        JWT_EXPIRES_IN: '5m',
        TECHNICIAN_EMAIL: TEST_EMAIL,
        TECHNICIAN_PASSWORD: TEST_PASS,
        CORS_ORIGIN: BASE_URL,
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
        NEXT_PUBLIC_API_URL: `http://127.0.0.1:${API_PORT}`,
        E2E_TEST_EMAIL: TEST_EMAIL,
        E2E_TEST_PASS: TEST_PASS,
      },
    },
  ],
});
