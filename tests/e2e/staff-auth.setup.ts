import { expect, test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STAFF_EMAIL = process.env.STAFF_EMAIL?.trim() || 'staff@mings.az';
const AUTH_STATE = path.join('test-results', 'staff-auth-state.json');

function staffPassword(): string {
  const value = process.env.STAFF_PASSWORD?.trim();
  if (!value) throw new Error('STAFF_PASSWORD required (set in .env.local)');
  return value;
}

setup('authenticate staff', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });

  await page.goto('/spec-ops?screen=home', { waitUntil: 'domcontentloaded', timeout: 60_000 });

  const email = page.locator('input[name="email"]');
  const onLoginScreen = await email
    .waitFor({ state: 'visible', timeout: 12_000 })
    .then(() => true)
    .catch(() => false);

  if (onLoginScreen) {
    await email.fill(STAFF_EMAIL);
    await page.locator('input[name="password"]').fill(staffPassword());
    await page.locator('button[type="submit"]').click();
    await expect(email).toHaveCount(0, { timeout: 30_000 });
  }

  await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 15_000 });
  const body = (await page.locator('body').innerText()) ?? '';
  expect(body.toLowerCase()).not.toMatch(/sign in to your account|welcome back.*sign in/i);

  await page.context().storageState({ path: AUTH_STATE });
});
