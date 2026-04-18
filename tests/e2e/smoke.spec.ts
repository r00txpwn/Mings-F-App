import { test, expect } from '@playwright/test';

/**
 * Smoke tests for all three public surfaces of mings.az.
 * These run against the built preview (127.0.0.1:4173).
 *
 * Routing is hostname-based in production but path-based in preview:
 *   /          → Staff cockpit (auth-gated)
 *   /order     → Customer ordering
 *   /kiosk     → Kiosk (secret-gated)
 *   /kds       → Kitchen Display (secret-gated)
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

    // Either a sign-in form or the cockpit shell must be visible
    const hasContent = await page
      .locator('body')
      .evaluate((el) => (el.textContent ?? '').trim().length > 0);
    expect(hasContent).toBe(true);
  });
});

test.describe('Customer ordering surface (/order)', () => {
  test('renders without JavaScript crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/order');
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('supabase'))).toHaveLength(0);
  });

  test('page has a title and non-empty body', async ({ page }) => {
    await page.goto('/order');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(0);
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

test.describe('Build integrity', () => {
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

  test('SPA rewrites work — deep path returns 200', async ({ page }) => {
    const res = await page.goto('/order/some/deep/path');
    // Vite preview serves index.html for all paths → 200
    expect(res?.status()).toBe(200);
  });
});
