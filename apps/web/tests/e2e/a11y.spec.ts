import { expect, test } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './credentials';

test('login é navegável apenas com teclado', async ({ page }) => {
  await page.goto('/login');
  // email tem autoFocus
  await page.keyboard.type(E2E_EMAIL);
  await page.keyboard.press('Tab'); // esqueci minha senha
  await page.keyboard.press('Tab'); // senha
  await page.keyboard.type(E2E_PASSWORD);
  await page.keyboard.press('Enter'); // submete o form
  await expect(page).toHaveURL(/\/dashboard/);
});

test('header tem landmark e link âncora para conteúdo', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(E2E_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: /navegação principal/i })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
});
