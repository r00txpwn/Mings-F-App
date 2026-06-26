import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENS = [
  'home',
  'sales',
  'kiosk-orders',
  'order-support',
  'delivery',
  'order-locations',
  'menu-builder',
  'combos',
  'money',
  'reports',
  'products',
  'suppliers',
  'expenses',
  'payouts',
  'users',
  'settings',
] as const;

const OUT_DIR = path.join('docs', 'qa-screenshots', 'cockpit-ui-audit-2026-06-22');

async function applyTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate((mode) => {
    localStorage.setItem('theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, theme);
}

async function waitForScreenReady(page: import('@playwright/test').Page, screen: string) {
  await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 15_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(1200);
  const body = (await page.locator('body').innerText()) ?? '';
  expect(body.length, `screen=${screen}`).toBeGreaterThan(20);
  expect(body.toLowerCase(), `screen=${screen}`).not.toMatch(/sign in to your account|welcome back/);
}

test.describe.configure({ mode: 'serial' });

test.describe('cockpit UI audit screenshots', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`capture all screens — ${theme} mode`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.goto('/spec-ops?screen=home', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await applyTheme(page, theme);
      const themeDir = path.join(OUT_DIR, theme);
      fs.mkdirSync(themeDir, { recursive: true });

      for (const screen of SCREENS) {
        await page.goto(`/spec-ops?screen=${screen}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await applyTheme(page, theme);
        await waitForScreenReady(page, screen);
        await page.screenshot({
          path: path.join(themeDir, `${screen}.png`),
          fullPage: true,
        });
      }
    });
  }
});
