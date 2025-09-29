// playwright.config.js
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const E2E_LIVE = process.env.E2E_LIVE === '1';
const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: 0,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  // Start the local server for mocked mode only
  webServer: E2E_LIVE
    ? undefined
    : {
        command: 'node app.js',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
