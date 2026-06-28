import { expect, test } from '@playwright/test';

const COCKPIT_SCREENS = [
  'home',
  'order-support',
  'delivery',
  'order-locations',
  'menu-builder',
  'combos',
  'products',
  'suppliers',
  'sales',
  'payments',
  'liabilities',
  'money',
  'expenses',
  'payouts',
  'staff',
  'reports',
  'settings',
] as const;

test.describe.configure({ mode: 'serial' });

test.describe('Staff functional QA (local 4175)', () => {
  test('staff login → cockpit home KPIs load', async ({ page }) => {
    await page.goto('/spec-ops?screen=home', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
    await expect(page.getByText(/revenue|gross|net|orders|gəlir|xalis|выручка/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('cockpit screens load without crash', async ({ page }) => {
    test.setTimeout(120_000);
    for (const screen of COCKPIT_SCREENS) {
      await page.goto(`/spec-ops?screen=${screen}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('input[name="email"]')).toHaveCount(0);
      await page.waitForTimeout(800);
      const body = (await page.locator('body').innerText()) ?? '';
      expect(body.length, `screen=${screen}`).toBeGreaterThan(20);
      expect(body.toLowerCase(), `screen=${screen}`).not.toMatch(/sign in to your account|welcome back/);
      if (/permission denied for table/i.test(body)) {
        console.warn(`[staff-functional] RLS warning on screen=${screen}`);
      }
    }
  });

  test('settings: language + theme controls visible', async ({ page }) => {
    await page.goto('/spec-ops?screen=settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /language|dil|язык/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: /theme|tema|тема/i })).toBeVisible();
  });

  test('KDS: board loads and can search kiosk order', async ({ page }) => {
    await page.goto('/kds', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/pending|gözləyən|ожид/i).first()).toBeVisible({ timeout: 20_000 });
    const search = page
      .locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Axtar" i]')
      .first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('M034');
      await page.waitForTimeout(800);
    }
    const startBtn = page.getByRole('button', { name: /start preparing|hazırlamağa başla|начать готовить/i }).first();
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.getByRole('button', { name: '15', exact: true }).click();
      await expect(page.getByRole('button', { name: /mark ready|hazır qeyd|готово/i }).first()).toBeVisible({
        timeout: 20_000,
      });
    }
  });

  test('POS: new order tab and submit takeaway', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/pos', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /new order|yeni sifariş|новый заказ/i }).click();
    await page.getByRole('button', { name: /takeaway|götürmə|с собой/i }).click();
    const productBtn = page.locator('.grid.grid-cols-2 button[type="button"]').first();
    await expect(productBtn).toBeVisible({ timeout: 20_000 });
    await productBtn.click();
    const addToCart = page.getByRole('button', { name: /add to cart|səbətə|корзину/i });
    if (await addToCart.isVisible().catch(() => false)) {
      if (!(await addToCart.isEnabled())) {
        await page.locator('button.rounded-\\[18px\\]').first().click();
      }
      await expect(addToCart).toBeEnabled({ timeout: 10_000 });
      await addToCart.click();
    }
    const submit = page.getByRole('button', { name: /create order|sifariş yarat|создать заказ/i });
    await expect(submit).toBeEnabled({ timeout: 10_000 });
    await submit.click();
    await expect(page.getByText(/M\d{3}/).first()).toBeVisible({ timeout: 30_000 });
  });

  test('Order Manager: active tab loads', async ({ page }) => {
    await page.goto('/order-manager', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByText(/new orders|yeni sifariş|новые заказ|in progress|hazırlanır|в работе/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('reports: POS source filter chips present', async ({ page }) => {
    await page.goto('/spec-ops?screen=reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /POS ·/i }).first()).toBeVisible({ timeout: 20_000 });
  });
});
