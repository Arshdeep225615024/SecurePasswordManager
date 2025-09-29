// playwright.config.js
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const LIVE_BASE = process.env.E2E_BASE_URL || null;   // e.g. https://staging.myapp.com
const useLive = !!LIVE_BASE;

module.exports = defineConfig({
  testDir: 'tests',
  testMatch: ['**/*.spec.js'],
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: LIVE_BASE || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Only start the local server when not pointing at a live base URL
  webServer: useLive ? undefined : {
    command: 'node app.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NODE_ENV: 'test' },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
