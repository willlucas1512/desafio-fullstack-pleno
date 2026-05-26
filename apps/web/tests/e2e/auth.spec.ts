import { expect, test } from '@playwright/test';

test.describe('Autenticação', () => {
  test('redireciona usuário não autenticado para /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /painel de acompanhamento/i })).toBeVisible();
  });

  test('login com credenciais válidas leva ao dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('a@b.test');
    await page.getByLabel('Senha').fill('x');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Total de crianças')).toBeVisible();
  });

  test('login com senha inválida mostra erro e permanece em /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('a@b.test');
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByRole('alert')).toContainText(/senha incorret|verifique/i);
    await expect(page).toHaveURL(/\/login/);
  });
});
