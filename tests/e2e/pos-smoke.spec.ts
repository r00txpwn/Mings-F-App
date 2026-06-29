import { test, expect } from '@playwright/test';

/**
 * POS surface smoke — staff bundle at /pos
 *   npm run deploy:local
 *   npx playwright test tests/e2e/pos-smoke.spec.ts --project=pos
 */
test.describe('POS (local preview)', () => {
  test('loads /pos without JavaScript crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });

  test('shows login gate or POS shell', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasPosShell =
      /point of sale|satış nöqtəsi|касса|pos tab|active|new order|yeni sifariş|новый заказ|settings|parametrlər|настройки/i.test(
        bodyText
      ) ||
      /sign in to your account|hesabınıza daxil|войдите в свою|sign in|daxil ol|войти/i.test(bodyText);
    expect(hasPosShell).toBe(true);
  });

  test('new order tab renders when authenticated', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    if (/sign in|daxil ol|войти/i.test(bodyText)) {
      test.skip(true, 'Staff login required for new order UI');
    }

    const newOrderTab = page.getByRole('button', { name: /new order|yeni sifariş|новый заказ/i });
    if (await newOrderTab.count()) {
      await newOrderTab.first().click();
      await expect(page.getByText(/eat in|yerdə|в зале|takeaway|götürmə/i).first()).toBeVisible();
    }
  });
});
