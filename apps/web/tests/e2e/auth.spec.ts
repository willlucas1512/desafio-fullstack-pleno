import { expect, test } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './credentials';

test.describe('Autenticação', () => {
  test('redireciona usuário não autenticado para /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /painel de acompanhamento/i })).toBeVisible();
  });

  test('login com credenciais válidas leva ao dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(E2E_EMAIL);
    await page.getByLabel('Senha').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Total de crianças')).toBeVisible();
  });

  test('login com senha inválida mostra erro e permanece em /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(E2E_EMAIL);
    await page.getByLabel('Senha').fill('senha-incorreta');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText(/senha incorret|verifique/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
