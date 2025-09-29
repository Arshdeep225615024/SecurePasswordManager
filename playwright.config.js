// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  // Only run *.spec.js
  testMatch: ['**/*.spec.js'],
  // Explicitly ignore Mocha tests and their folders
  testIgnore: ['**/*.test.js', '**/unitTests/**', '**/integrationTests/**'],

  timeout: 30_000,
  retries: 0,
  fullyParallel: true,

  webServer: process.env.E2E_LIVE
    ? undefined
    : {
        command: 'node app.js',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
      },

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
