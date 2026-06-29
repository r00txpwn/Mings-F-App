import { test, expect } from '@playwright/test';

/**
 * Kiosk light-theme flow smoke — staff preview:
 *   npm run deploy:local
 *   npx playwright test --project=kiosk
 */
test.describe('Kiosk (local preview)', () => {
  test('loads /kiosk without JavaScript crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const kioskKey = process.env.VITE_KIOSK_SECRET ?? '';
    const url = kioskKey ? `/kiosk?key=${encodeURIComponent(kioskKey)}` : '/kiosk';
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });

  test('idle → categories → menu with sticky footer', async ({ page }) => {
    const kioskKey = process.env.VITE_KIOSK_SECRET ?? '';
    const url = kioskKey ? `/kiosk?key=${encodeURIComponent(kioskKey)}` : '/kiosk';
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    const eatIn = page.getByRole('button', { name: /eat in|burada yemək|в зале/i });
    await expect(eatIn).toBeVisible({ timeout: 15_000 });
    await eatIn.click();

    await expect(
      page.getByRole('heading', { name: /explore our menu|menyumuzu kəşf|изучите наше меню/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('button', { name: /order now|sifariş ver|заказать/i })).toBeVisible();

    const categoryCards = page.locator('div.mx-auto.grid button');
    const count = await categoryCards.count();
    if (count === 0) {
      test.skip(true, 'No kiosk categories with products in this environment');
    }
    await categoryCards.first().click();

    await expect(page.getByRole('button', { name: /add to cart|səbətə|корзину/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('add item updates footer total', async ({ page }) => {
    const kioskKey = process.env.VITE_KIOSK_SECRET ?? '';
    const url = kioskKey ? `/kiosk?key=${encodeURIComponent(kioskKey)}` : '/kiosk';
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /eat in|burada yemək|в зале/i }).click();
    const categoryCards = page.locator('div.mx-auto.grid button');
    if ((await categoryCards.count()) === 0) {
      test.skip(true, 'No kiosk categories with products in this environment');
    }
    await categoryCards.first().click();

    const addBtn = page.getByRole('button', { name: /^add to cart$|^səbətə|^в корзину$/i }).first();
    if (!(await addBtn.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, 'No simple (non-modifier) products in first category');
    }
    await addBtn.click();

    const totalLine = page.locator('footer').getByText(/₼\d+\.\d{2}/);
    await expect(totalLine).toBeVisible();
    await expect(totalLine).not.toHaveText(/₼0\.00/);
  });
});
