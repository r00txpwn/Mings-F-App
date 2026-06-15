import { test, expect } from '@playwright/test';

/**
 * Staff bundle smoke (dist-staff) — preview http://127.0.0.1:4175
 */
test.describe('Staff cockpit', () => {
  test('renders without JavaScript crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });

  test('shows a login / auth gate (not a blank page)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('body')
      .evaluate((el) => (el.textContent ?? '').trim().length > 0);
    expect(hasContent).toBe(true);
  });

  test('storefront paths are not served from staff bundle', async ({ page }) => {
    await page.goto('/order');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).not.toMatch(/online ordering|sifariş/i);
  });
});

test.describe('Build integrity (staff)', () => {
  test('no 404s on main JS/CSS bundles', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (res) => {
      if (res.status() === 404 && /\.(js|css)$/.test(res.url())) {
        failed.push(res.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failed, `404 on bundles: ${failed.join(', ')}`).toHaveLength(0);
  });

  test('SPA rewrites work — deep staff path returns 200', async ({ page }) => {
    const res = await page.goto('/spec-ops?screen=dashboard');
    expect(res?.status()).toBe(200);
  });
});
