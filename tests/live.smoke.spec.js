// tests/live.smoke.spec.js
const { test, expect } = require('@playwright/test');

const LIVE = !!process.env.E2E_LIVE;

test.describe('Live smoke', () => {
  test.skip(!LIVE, 'Set E2E_LIVE=1 (and E2E_BASE_URL) to run live smoke tests.');

  test('home loads and health is OK', async ({ page, request, baseURL }) => {
    // home loads
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /password strength/i })).toBeVisible();

    // health endpoint returns ok:true (add /api/health to app.js if you haven’t)
    const res = await request.get(new URL('/api/health', baseURL).toString());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
