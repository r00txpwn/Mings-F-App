import { defineConfig, devices } from '@playwright/test';



const staffBase = process.env.PLAYWRIGHT_STAFF_URL ?? 'http://127.0.0.1:4175';

const storefrontBase = process.env.PLAYWRIGHT_STOREFRONT_URL ?? 'http://127.0.0.1:4176';



export default defineConfig({

  testDir: './tests/e2e',

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 1 : 0,

  workers: 1,

  reporter: [

    ['list'],

    ['json', { outputFile: 'test-results/e2e-results.json' }],

    ['html', { outputFolder: 'playwright-report', open: 'never' }],

  ],

  projects: [

    {

      name: 'staff',

      testMatch: '**/smoke.staff.spec.ts',

      use: {

        ...devices['Desktop Chrome'],

        baseURL: staffBase,

      },

    },

    {

      name: 'storefront',

      testMatch: '**/smoke.storefront.spec.ts',

      use: {

        ...devices['Desktop Chrome'],

        baseURL: storefrontBase,

      },

    },

  ],

  webServer: process.env.CI

    ? undefined

    : [

        {

          command: 'npm run deploy:local',

          url: staffBase,

          reuseExistingServer: true,

          timeout: 120_000,

        },

        {

          command: 'npm run deploy:local:storefront',

          url: storefrontBase,

          reuseExistingServer: true,

          timeout: 120_000,

        },

      ],

});


