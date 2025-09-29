// tests/critical.spec.js
const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const LIVE = !!process.env.E2E_LIVE; // when true, no mocks and we hit your real server

test.describe('Critical workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Open home for most tests
    await page.goto('/');

    // Start clean: avoid jwt noise & protected calls interfering
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    if (!LIVE) {
      // Silence vault fetch on homepage (if it runs on load)
      await page.route('**/api/passwords', route =>
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '[]',
        })
      );
    }
  });

  test('strength meter: weak → strong → very strong', async ({ page }) => {
    await page.fill('#password', '12345'); // weak
    await expect(page.locator('#strengthText')).toContainText(/weak|very weak/i);

    await page.fill('#password', 'Aa1!aaaa'); // stronger
    await expect(page.locator('#strengthText')).toContainText(/strong|fair/i);

    await page.fill('#password', 'Aa1!Aa1!Aa1!'); // very strong
    await expect(page.locator('#strengthText')).toContainText(/very strong|strong/i);
  });

  test('breach check (mock HIBP in mocked mode)', async ({ page }) => {
    const pw = 'Aa1!Aa1!';

    if (!LIVE) {
      // Compute SHA1 to produce the exact HIBP range URL
      const hex = crypto.createHash('sha1').update(pw).digest('hex').toUpperCase();
      const prefix = hex.slice(0, 5);
      const suffix = hex.slice(5);

      // Return a match for our suffix with count=42
      await page.route(`https://api.pwnedpasswords.com/range/${prefix}`, route => {
        const body = `${suffix}:42\nDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADB:1`;
        route.fulfill({ status: 200, headers: { 'content-type': 'text/plain' }, body });
      });

      // Belt-and-suspenders: if UI falls back to backend breach, mock that too
      await page.route(/\/api\/.*breach.*/i, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pwnedCount: 42 }),
        });
      });
    }

    await page.fill('#appName', 'DemoApp');
    await page.fill('#password', pw);
    await page.click('#checkBtn');

    if (!LIVE) {
      await expect(page.locator('#breachResult')).toContainText(/42/);
    } else {
      // In live mode, just expect some non-empty message (don’t hard-code numbers)
      await expect(page.locator('#breachResult')).not.toHaveText('');
    }
  });

  test('signup form: validates & submits', async ({ page }) => {
    await page.goto('/signup');

    if (!LIVE) {
      // Mock exactly /api/signup in mocked mode
      await page.route('**/api/signup', async route => {
        return route.fulfill({
          status: 201,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            token: 'fake-jwt',
            user: { _id: '1', fullName: 'Test User', email: 'user@example.com' },
          }),
        });
      });
    }

    // Use a unique email each run to avoid “User already exists” in live mode
    const uniqueEmail = `user+${Date.now()}@example.com`;

    await page.fill('#fullName', 'Test User');
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'Aa1!Aa1!Aa1!');
    await page.fill('#confirmPassword', 'Aa1!Aa1!Aa1!');
    await page.check('#terms');

    const submit = page.locator('#signupSubmit');
    await expect(submit).toBeEnabled();
    await submit.click();

    // Wait for token and redirect (allow extra time for live hashing/DB)
    await page.waitForFunction(() => !!localStorage.getItem('token'), { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/signup$/, { timeout: 15000 });
  });
});
