/**
 * One-off Playwright run: screenshot every staff cockpit screen in light + dark mode.
 * Usage: node scripts/run-cockpit-ui-audit.mjs
 */
import { defineConfig, devices } from '@playwright/test';

const staffBase = process.env.PLAYWRIGHT_STAFF_URL ?? 'http://127.0.0.1:4175';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/cockpit-ui-audit.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: staffBase,
    viewport: { width: 1440, height: 900 },
    storageState: 'docs/qa-screenshots/.auth/staff-auth-state.json',
    screenshot: 'off',
  },
});
