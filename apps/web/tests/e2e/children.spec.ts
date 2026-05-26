import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('a@b.test');
  await page.getByLabel('Senha').fill('x');
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
});

test.describe('Lista de crianças', () => {
  test('mostra a lista e responde a filtros', async ({ page }) => {
    await page.goto('/children');
    await expect(page.getByRole('heading', { name: /crianças acompanhadas/i })).toBeVisible();

    const items = page.getByRole('list').first().getByRole('listitem');
    await expect(items).toHaveCount(10);

    // filtra por bairro
    await page.getByLabel(/filtrar por bairro/i).click();
    await page.getByRole('option', { name: 'Rocinha' }).click();
    await page.waitForURL(/bairro=Rocinha/);
    await expect(items).toHaveCount(5);

    // filtra por presenca de alerta
    await page.getByLabel(/filtrar por presença de alertas/i).click();
    await page.getByRole('option', { name: /com algum alerta/i }).click();
    await page.waitForURL(/alertas=com/);
  });

  test('detalhe da criança mostra as três áreas e o estado "sem dados" quando aplicável', async ({
    page,
  }) => {
    await page.goto('/children/c015'); // c015 has all three areas null
    await expect(page.getByRole('heading', { name: 'Amanda Xavier Torres' })).toBeVisible();
    await expect(page.getByText(/Sem dados de saúde/i)).toBeVisible();
    await expect(page.getByText(/Sem dados de educação/i)).toBeVisible();
    await expect(page.getByText(/Sem dados de assistência social/i)).toBeVisible();
  });

  test('marca como revisado e mostra feedback', async ({ page }) => {
    await page.goto('/children/c001');
    const button = page.getByRole('button', { name: /marcar como revisado/i });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByText(/revisado por/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /já revisado/i })).toBeDisabled();
  });
});
