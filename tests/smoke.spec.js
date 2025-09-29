// tests/smoke.spec.js
const { test, expect } = require('@playwright/test');

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Password Strength/i })).toBeVisible();
  // accept either id
  await expect(page.locator('#savePasswordBtn, #saveBtn')).toBeVisible();
});

test('strength meter reacts', async ({ page }) => {
  await page.goto('/');
  await page.fill('#password', 'CorrectHorseBatteryStaple!1');
  await expect(page.locator('#strengthFill')).toBeVisible();
});
