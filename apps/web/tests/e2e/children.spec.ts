import { expect, test } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './credentials';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(E2E_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
});

test.describe('Lista de crianças', () => {
  test('mostra a lista e responde a filtros', async ({ page }) => {
    await page.goto('/children');
    await expect(page.getByRole('heading', { name: /em acompanhamento/i })).toBeVisible();

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
    await expect(page.getByRole('heading', { name: 'Saúde' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Educação' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Assistência social' })).toBeVisible();
    await expect(page.getByText('Sem dados', { exact: true })).toHaveCount(3);
  });

  test('marca como revisado e mostra feedback', async ({ page }) => {
    await page.goto('/children/c001');

    const reviewBtn = page.getByRole('button', { name: /marcar como revisado/i });
    const undoBtn = page.getByRole('button', { name: /desfazer revisão/i });

    // O banco de e2e é compartilhado/persistente. Espera os controles de revisão
    // renderizarem e, se c001 já estiver revisado de um run anterior, desfaz pra
    // restaurar o baseline não-revisado (mantém o teste repetível).
    await expect(reviewBtn.or(undoBtn)).toBeVisible();
    if (await undoBtn.isVisible()) {
      await undoBtn.click();
      await expect(reviewBtn).toBeEnabled();
    }

    await expect(reviewBtn).toBeEnabled();
    await reviewBtn.click();
    await expect(page.getByText(/revisado por/i)).toBeVisible();
    await expect(undoBtn).toBeVisible();
  });
});
