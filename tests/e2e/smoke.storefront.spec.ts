import { test, expect } from '@playwright/test';

/**
 * Storefront bundle smoke (dist-storefront) — preview http://127.0.0.1:4176
 */
test.describe('Customer ordering surface', () => {
  test('renders without JavaScript crash on /order', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/order');
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });

  test('root and /order have title and non-empty body', async ({ page }) => {
    for (const path of ['/', '/order']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title.length, `title for ${path}`).toBeGreaterThan(0);

      const bodyText = await page.locator('body').textContent();
      expect((bodyText ?? '').trim().length, `body for ${path}`).toBeGreaterThan(0);
    }
  });
});

test.describe('Order tracking surface (/track)', () => {
  test('renders without JavaScript crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/track');
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });
});

test.describe('Build integrity (storefront)', () => {
  test('no 404s on main JS/CSS bundles', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (res) => {
      if (res.status() === 404 && /\.(js|css)$/.test(res.url())) {
        failed.push(res.url());
      }
    });

    await page.goto('/order');
    await page.waitForLoadState('networkidle');

    expect(failed, `404 on bundles: ${failed.join(', ')}`).toHaveLength(0);
  });

  test('SPA rewrites work — deep path returns 200', async ({ page }) => {
    const res = await page.goto('/order/some/deep/path');
    expect(res?.status()).toBe(200);
  });

  test('staff-only paths are not served from storefront bundle', async ({ page }) => {
    await page.goto('/spec-ops');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).not.toMatch(/cockpit|spec-ops dashboard/i);
  });
});
