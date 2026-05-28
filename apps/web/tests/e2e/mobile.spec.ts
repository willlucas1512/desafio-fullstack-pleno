import { devices, expect, test } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './credentials';

test.use({ viewport: { width: 375, height: 667 } });

test.describe('Mobile 375px', () => {
  test('login cabe sem overflow horizontal', async ({ page }) => {
    await page.goto('/login');
    const html = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(html.scrollWidth).toBeLessThanOrEqual(html.clientWidth);
  });

  test('dashboard renderiza sem overflow', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(E2E_EMAIL);
    await page.getByLabel('Senha', { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText('Total de crianças')).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('lista e detalhe sem overflow horizontal', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(E2E_EMAIL);
    await page.getByLabel('Senha', { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/children');
    await expect(page.getByRole('heading', { name: /crianças acompanhadas/i })).toBeVisible();
    let dims = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dims.scrollWidth).toBeLessThanOrEqual(dims.clientWidth);

    await page.goto('/children/c015');
    await expect(page.getByText(/sem dados de saúde/i)).toBeVisible();
    dims = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dims.scrollWidth).toBeLessThanOrEqual(dims.clientWidth);
  });
});
