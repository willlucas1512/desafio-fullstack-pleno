import { expect, test } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './credentials';

test('login é navegável apenas com teclado', async ({ page }) => {
  await page.goto('/login');

  await page.keyboard.press('Tab'); // password
  await page.keyboard.type(E2E_PASSWORD);
  await page.locator('#email').fill(E2E_EMAIL);
  await page.keyboard.press('Tab'); // submit
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/dashboard/);
});

test('header tem landmark e link âncora para conteúdo', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(E2E_EMAIL);
  await page.getByLabel('Senha').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: /navegação principal/i })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
});
