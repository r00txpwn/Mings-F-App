import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /(customer-journey|verify-fix)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.SCREENSHOT_BASE_URL ?? 'https://order.mings.az',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
});
