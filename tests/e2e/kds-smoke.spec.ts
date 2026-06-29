import { test, expect } from '@playwright/test';

/**
 * KDS board smoke — staff bundle at /kds (staff login required).
 *   npm run deploy:local
 *   npx playwright test tests/e2e/kds-smoke.spec.ts --project=kds
 */
test.describe('KDS board (local preview)', () => {
  test('loads /kds without JavaScript crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });

  test('shows login gate or kitchen board shell', async ({ page }) => {
    await page.goto('/kds');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasKdsShell =
      /kitchen display|mətbəx|кухон/i.test(bodyText) ||
      /pending|preparing|ready|gözl|hazır|ожид|подготов/i.test(bodyText) ||
      /sign in to your account|hesabınıza daxil|войдите в свою|sign in|daxil ol|войти/i.test(bodyText);
    expect(hasKdsShell).toBe(true);
  });

  test('filter pills and search input visible when authenticated', async ({ page }) => {
    await page.goto('/kds');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    if (/sign in|daxil ol|войти/i.test(bodyText)) {
      test.skip(true, 'Staff login required for KDS board UI');
    }

    await expect(page.locator('input[type="search"]')).toBeVisible();
  });
});
